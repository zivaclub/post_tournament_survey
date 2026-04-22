import { useMemo, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Lightbulb, Timer, Award, BarChart3, Download } from "lucide-react";
import { QUESTIONS } from "./constants";
import {
  AnswerValue,
  AppState,
  ComputedReport,
  Player,
  PostSurveySubmission,
  PreSurveyRecord,
  Question,
} from "./types";
import logo from "./logo.svg";

const STORAGE_KEY = "ziva-post-survey-submissions";
const DEFAULT_PLAYERS: Player[] = [{ name: "Rahul Sharma" }, { name: "Amit Patel" }, { name: "Priya Shah" }];

// Load data from sample-data directory
const loadSampleData = async () => {
  try {
    // Import the JSON files directly
    const { default: playersData } = await import('./sample-data/players.sample.json');
    const { default: preSurveyData } = await import('./sample-data/pre-survey.sample.json');
    return { playersData, preSurveyData };
  } catch (error) {
    console.error('Error loading sample data:', error);
    return { playersData: DEFAULT_PLAYERS, preSurveyData: [] };
  }
};

export default function App() {
  const surveyPath = window.location.pathname;
  const surveyQuestions = surveyPath === "/pre-survey" ? QUESTIONS.slice(0, 7) : QUESTIONS;
  const [appState, setAppState] = useState<AppState>(window.location.pathname === "/admin" ? "admin" : "landing");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [nameQuery, setNameQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [preSurveyData, setPreSurveyData] = useState<PreSurveyRecord[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [latestReport, setLatestReport] = useState<ComputedReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<PostSurveySubmission[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [appState, currentStep]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    const loadData = async () => {
      const { playersData, preSurveyData: preData } = await loadSampleData();
      setPlayers(playersData);
      setPreSurveyData(preData);
      setDataLoaded(true);
    };
    loadData();
  }, []);

  const filteredPlayers = useMemo(() => {
    if (!dataLoaded) return [];
    const q = nameQuery.toLowerCase();
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [players, nameQuery, dataLoaded]);

  const selectedPre = useMemo(
    () => preSurveyData.find((p) => p.name.toLowerCase() === selectedPlayer.toLowerCase()),
    [preSurveyData, selectedPlayer]
  );

  const handleStart = () => {
    if (!selectedPlayer) return;
    setAppState("survey");
  };

  const parseJsonFile = async <T,>(file: File): Promise<T> => {
    const text = await file.text();
    return JSON.parse(text) as T;
  };

  const handlePlayersImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = await parseJsonFile<Player[]>(file);
      const clean = imported.filter((item) => typeof item?.name === "string" && item.name.trim().length > 0);
      setPlayers(clean);
      setNameQuery("");
      setSelectedPlayer("");
    } catch (error) {
      alert("Invalid player JSON file.");
      console.error(error);
    }
  };

  const handlePreSurveyImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = await parseJsonFile<PreSurveyRecord[]>(file);
      setPreSurveyData(imported);
    } catch (error) {
      alert("Invalid pre-survey JSON file.");
      console.error(error);
    }
  };

  const computeReport = (
    finalAnswers: Record<number, AnswerValue>,
    preMatch?: PreSurveyRecord
  ): ComputedReport => {
    const num = (id: number) => Number(finalAnswers[id] || 0);
    const pre = (id: number) => Number(preMatch?.answers?.[`q${id}`] ?? 0);

    const confidenceScore = Math.round(((num(9) - 2) * 15 + (num(10) - 3) * 10 + (num(8) - 5) * 4));
    const energyScore = Math.round(((num(11) + num(12)) / 10) * 100 - 50);
    const socialConfidence = Math.round(((num(13) + num(14)) / 8) * 100 - 25);

    const preMentalAvg = preMatch ? [1, 2, 3, 4, 5, 6, 7].reduce((sum, id) => sum + pre(id), 0) / 7 : 0;
    const postMentalAvg = [1, 2, 3, 4, 5, 6, 7].reduce((sum, id) => sum + num(id), 0) / 7;
    const mentalWellnessChange = preMatch ? Math.round(((postMentalAvg - preMentalAvg) / Math.max(preMentalAvg, 1)) * 100) : 0;

    const strengths: string[] = [];
    if (confidenceScore > 10) strengths.push("Competitive mindset improved");
    if (energyScore > 10) strengths.push("Better physical motivation");
    if (socialConfidence > 10) strengths.push("Stronger social confidence");
    if (strengths.length === 0) strengths.push("Consistent participation and effort");

    const participationIntent = String(finalAnswers[17] || "");
    const suggestions = participationIntent === "Yes"
      ? ["Join advanced cricket league", "Continue weekly participation"]
      : ["Keep training with weekly sessions", "Review personal performance trends"];

    return { confidenceScore, energyScore, socialConfidence, mentalWellnessChange, strengths, suggestions };
  };

  const submitToGoogleSheets = async (payload: PostSurveySubmission) => {
    try {
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const handleNext = async () => {
    if (currentStep < surveyQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setIsSubmitting(true);
    const computed = computeReport(answers, selectedPre);
    const submission: PostSurveySubmission = {
      player_name: selectedPlayer,
      timestamp: new Date().toISOString(),
      answers,
      computed_report: computed,
      compared_with_pre: Boolean(selectedPre),
      pre_match_found: Boolean(selectedPre),
    };

    setLatestReport(computed);
    setSubmissions((prev) => [submission, ...prev]);
    await submitToGoogleSheets(submission);
    setAppState("complete");
    setIsSubmitting(false);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setAppState("landing");
    }
  };

  const handleSelect = (value: AnswerValue) => {
    const question = surveyQuestions[currentStep];
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleExit = () => {
    setAppState("landing");
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-background selection:bg-primary selection:text-on-primary">
      <Header onExit={handleExit} />

      <main className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {appState === "landing" && (
            <LandingPage
              onStart={handleStart}
              players={filteredPlayers}
              selectedPlayer={selectedPlayer}
              nameQuery={nameQuery}
              setNameQuery={setNameQuery}
              onSelectPlayer={(name) => {
                setSelectedPlayer(name);
                setNameQuery(name);
              }}
              onPlayersImport={handlePlayersImport}
              onPreSurveyImport={handlePreSurveyImport}
              preLoadedCount={preSurveyData.length}
            />
          )}
          {appState === "survey" && (
            <SurveyPage
              currentStep={currentStep}
              totalSteps={surveyQuestions.length}
              question={surveyQuestions[currentStep]}
              selectedAnswer={answers[surveyQuestions[currentStep].id]}
              onSelect={handleSelect}
              onNext={handleNext}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
          {appState === "complete" && latestReport && (
            <CompletionPage
              name={selectedPlayer}
              report={latestReport}
              onReset={() => {
                setAppState("landing");
                setCurrentStep(0);
                setAnswers({});
                setNameQuery("");
                setSelectedPlayer("");
              }}
            />
          )}
          {appState === "admin" && <AdminPage submissions={submissions} onBack={() => setAppState("landing")} />}
        </AnimatePresence>
      </main>

      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
    </div>
  );
}

function Header({ onExit }: { onExit: () => void }) {
  return (
    <header className="bg-surface-container-low text-primary shadow-[0_32px_32px_rgba(186,246,245,0.08)] flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Ziva Club logo" className="w-6 h-6" />
        <h1 className="font-manrope font-black uppercase tracking-tight text-xl">ZIVA CLUB</h1>
      </div>
      <button onClick={onExit} className="font-manrope font-extrabold uppercase tracking-tight text-white hover:text-secondary transition-colors duration-200 active:scale-95 text-sm">
        Save & Exit
      </button>
    </header>
  );
}

function LandingPage({
  onStart,
  players,
  selectedPlayer,
  nameQuery,
  setNameQuery,
  onSelectPlayer,
  onPlayersImport,
  onPreSurveyImport,
  preLoadedCount,
}: {
  onStart: () => void;
  players: Player[];
  selectedPlayer: string;
  nameQuery: string;
  setNameQuery: (val: string) => void;
  onSelectPlayer: (name: string) => void;
  onPlayersImport: (file?: File) => void;
  onPreSurveyImport: (file?: File) => void;
  preLoadedCount: number;
}) {
  const validSelection = selectedPlayer.length > 0 && players.some((p) => p.name === selectedPlayer);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col pb-24">
      <section className="relative w-full h-[410px] flex flex-col justify-end px-6 pb-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" alt="Athlete" className="w-full h-full object-cover opacity-20 mix-blend-luminosity" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#2efd7c]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">POST TOURNAMENT</span>
          </div>
          <h1 className="text-[2.5rem] font-black leading-[0.9] tracking-tighter mb-4 italic">
            LET THE <span className="text-primary">GAME</span><br />COME TO <span className="text-secondary">YOU</span>
          </h1>
          <p className="text-on-surface-variant max-w-[92%] leading-relaxed text-sm">
            Complete the post-tournament survey in under 2 minutes and get an instant personalized growth report.
          </p>
        </div>
      </section>

      <section className="px-6 -mt-6 relative z-20 space-y-3">
        <div className="glass-card p-5 rounded-lg border-l-2 border-primary">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Enter Your Name</label>
          <input
            type="text"
            value={nameQuery}
            onChange={(e) => {
              const value = e.target.value;
              setNameQuery(value);
              onSelectPlayer(value);
            }}
            placeholder="Enter your full name..."
            className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
          />
          {nameQuery && players.length > 0 && (
            <div className="mt-2 max-h-32 overflow-auto space-y-1">
              <p className="text-[10px] text-on-surface-variant mb-1">Suggestions:</p>
              {players.map((p) => (
                <button
                  key={p.name}
                  onClick={() => onSelectPlayer(p.name)}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs ${selectedPlayer === p.name ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-lg border-l-2 border-secondary flex flex-col justify-between h-32">
            <Timer className="text-secondary w-5 h-5" />
            <div>
              <div className="text-2xl font-black text-on-surface">2:00</div>
              <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Est. Time</div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-lg flex flex-col justify-between h-32">
            <Award className="text-primary w-5 h-5" />
            <div>
              <div className="text-2xl font-black text-on-surface">Personal</div>
              <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Growth Report</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 px-6 flex flex-col items-center">
        <button
          onClick={onStart}
          disabled={!validSelection}
          className="w-full bg-gradient-to-r from-primary to-primary-container py-4 rounded-full text-on-primary font-black uppercase tracking-[0.15em] text-base shadow-[0_15px_30px_rgba(80,244,227,0.2)] active:scale-95 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Post Survey
        </button>
        <button
          onClick={() => window.open('https://survey.ziva.club', '_blank')}
          className="w-full bg-surface-container-high border border-outline-variant/30 py-3 rounded-full text-primary font-bold uppercase tracking-[0.15em] text-sm transition-all hover:bg-surface-variant mb-3"
        >
          Go to Pre-Survey
        </button>
        <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold opacity-60">Only listed players can submit</p>
      </section>
    </motion.div>
  );
}

function SurveyPage({
  currentStep,
  totalSteps,
  question,
  selectedAnswer,
  onSelect,
  onNext,
  onBack,
  isSubmitting,
}: {
  currentStep: number;
  totalSteps: number;
  question: Question;
  selectedAnswer?: AnswerValue;
  onSelect: (val: AnswerValue) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isText = question.inputType === "text";
  const answerReady = isText ? String(selectedAnswer || "").trim().length > 0 : selectedAnswer !== undefined;

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex-1 flex flex-col px-6 pt-8 pb-12 mesh-gradient">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3">
          <span className="font-bold text-primary uppercase tracking-widest text-[10px]">Progress</span>
          <span className="font-extrabold text-on-surface text-base">{currentStep + 1}<span className="text-on-surface-variant font-normal text-xs ml-1">/ {totalSteps}</span></span>
        </div>
        <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_10px_rgba(80,244,227,0.4)]" />
        </div>
      </div>

      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">{question.category}</h2>
          <p className="font-extrabold text-xl leading-tight text-on-surface">{question.text}</p>
        </div>

        {question.highlight && (
          <div className="bg-surface-container-low rounded-lg p-6 border-l-4 border-secondary kinetic-glow">
            <p className="text-lg font-bold italic text-tertiary">"{question.highlight}"</p>
          </div>
        )}

        {question.hint && (
          <div className="rounded-lg p-3 bg-surface-container-low border border-outline-variant/20 flex items-start gap-2">
            <Lightbulb className="text-secondary w-4 h-4 mt-0.5" />
            <p className="text-xs text-on-surface-variant">{question.hint}</p>
          </div>
        )}

        {isText ? (
          <textarea
            value={String(selectedAnswer || "")}
            onChange={(e) => onSelect(e.target.value)}
            placeholder={question.inputPlaceholder}
            className="w-full min-h-28 bg-surface-container-high border border-outline-variant/20 rounded-lg p-3 text-sm focus:outline-none focus:border-primary"
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {question.options?.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => onSelect(opt.value)}
                disabled={isSubmitting}
                className={`flex items-center justify-between p-4 rounded-lg transition-all active:scale-[0.98] group ${selectedAnswer === opt.value ? "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_0_15px_rgba(80,244,227,0.3)] transform scale-[1.01]" : "bg-surface-container-high border border-outline-variant/20 hover:border-primary/50"}`}
              >
                <span className={`font-bold text-sm ${selectedAnswer === opt.value ? "text-on-primary" : "text-on-surface-variant group-hover:text-primary"}`}>{opt.label}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-colors ${selectedAnswer === opt.value ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-highest text-on-surface group-hover:bg-primary group-hover:text-on-primary"}`}>
                  {typeof opt.value === "number" ? opt.value : opt.label[0]}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="pt-4 flex gap-3">
          <button onClick={onBack} disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-full bg-surface-container-highest text-primary border border-outline-variant/30 font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-surface-variant disabled:opacity-50">
            Back
          </button>
          <button onClick={onNext} disabled={!answerReady || isSubmitting} className={`flex-[2] py-3 px-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all ${answerReady && !isSubmitting ? "bg-gradient-to-r from-secondary to-primary-container text-on-primary" : "bg-surface-variant text-on-surface-variant cursor-not-allowed"}`}>
            {isSubmitting ? "Submitting..." : currentStep === totalSteps - 1 ? "Generate Report" : "Next Question"}
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function CompletionPage({ name, report, onReset }: { name: string; report: ComputedReport; onReset: () => void }) {
  const handleDownload = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById('report-content');
      if (element) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const link = document.createElement('a');
        link.download = `${name.replace(/\s+/g, '_')}_growth_report.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col px-6 pt-8 pb-24">
      <div className="relative mb-8 self-center">
        <div className="absolute -inset-4 bg-secondary/20 rounded-full blur-xl" />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-[0_0_30px_rgba(46,253,124,0.4)]">
          <CheckCircle className="text-on-primary w-12 h-12" />
        </div>
      </div>

      <div id="report-content" className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight mb-3 text-center text-gray-800">
          {name} - Ziva Growth Report
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
          <p className="text-sm text-gray-700">Confidence Score: <span className="text-secondary font-bold">{report.confidenceScore}%</span></p>
          <p className="text-sm text-gray-700">Energy Score: <span className="text-secondary font-bold">{report.energyScore}%</span></p>
          <p className="text-sm text-gray-700">Social Confidence: <span className="text-secondary font-bold">{report.socialConfidence}%</span></p>
          <p className="text-sm text-gray-700">Mental Wellness Change: <span className="text-secondary font-bold">{report.mentalWellnessChange}%</span></p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="font-bold mb-2 text-gray-800">Strengths</p>
          {report.strengths.map((item) => <p className="text-sm text-gray-600" key={item}>- {item}</p>)}
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="font-bold mb-2 text-gray-800">Suggested Next Step</p>
          {report.suggestions.map((item) => <p className="text-sm text-gray-600" key={item}>- {item}</p>)}
        </div>
        <div className="text-center text-xs text-gray-500 mt-4">
          Generated on {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button 
          onClick={handleDownload}
          className="flex-1 bg-surface-container-high border border-outline-variant/30 py-3 rounded-full text-primary font-bold uppercase tracking-[0.15em] text-sm transition-all hover:bg-surface-variant flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
        <button onClick={onReset} className="flex-1 py-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-extrabold uppercase tracking-widest text-sm">
          Back to Start
        </button>
      </div>
    </motion.div>
  );
}

function AdminPage({ submissions, onBack }: { submissions: PostSurveySubmission[]; onBack: () => void }) {
  const total = submissions.length;
  const avg = (items: number[]) => (items.length ? Math.round(items.reduce((a, b) => a + b, 0) / items.length) : 0);
  const avgConfidenceImprovement = avg(submissions.map((s) => s.computed_report.confidenceScore));
  const avgMentalWellnessChange = avg(submissions.map((s) => s.computed_report.mentalWellnessChange));
  const participationYes = submissions.filter((s) => s.answers[17] === "Yes").length;
  const participationIntent = total ? Math.round((participationYes / total) * 100) : 0;
  const knownSports = ["cricket", "football", "badminton", "basketball", "tennis", "volleyball", "kabaddi"];
  const sportCounts = submissions.reduce<Record<string, number>>((acc, item) => {
    const text = String(item.answers[16] || "").toLowerCase();
    const matchedSport = knownSports.find((sport) => text.includes(sport));
    if (matchedSport) {
      acc[matchedSport] = (acc[matchedSport] || 0) + 1;
    }
    return acc;
  }, {});
  const mostRequestedFutureSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Not enough data";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 p-6 space-y-3">
      <h2 className="text-xl font-black mb-2">Admin Analytics</h2>
      <MetricCard label="Total submissions" value={String(total)} icon={<BarChart3 className="w-4 h-4 text-secondary" />} />
      <MetricCard label="Avg confidence improvement" value={`${avgConfidenceImprovement}%`} />
      <MetricCard label="Avg mental wellness change" value={`${avgMentalWellnessChange}%`} />
      <MetricCard label="Participation intent (Yes %)" value={`${participationIntent}%`} />
      <MetricCard label="Most requested future sport" value={mostRequestedFutureSport} />
      <button onClick={onBack} className="w-full mt-3 py-3 rounded-full bg-surface-container-high border border-outline-variant/30 font-bold text-xs uppercase tracking-widest">
        Back
      </button>
    </motion.div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="glass-card rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black">{value}</p>
      </div>
      {icon}
    </div>
  );
}
