import { useMemo, useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Lightbulb, Timer, Award, BarChart3, Download, TrendingUp, Users, Target, Heart } from "lucide-react";
import { QUESTIONS } from "./constants";
import {
  AnswerValue,
  AppState,
  ComputedReport,
  Player,
  PostSurveySubmission,
  PreSurveyRecord,
  Question,
  CohortAnalytics,
} from "./types";
import { calculateAnalytics, generateStrengths, generateSuggestions } from "./analytics";
import logo from "./logo.svg";

const STORAGE_KEY = "ziva-post-survey-submissions";
const DEFAULT_PLAYERS: Player[] = [{ name: "Rahul Sharma" }, { name: "Amit Patel" }, { name: "Priya Shah" }];

// Load data from Google Sheets API
const loadGoogleSheetsData = async () => {
  try {
    // Fetch player names and pre-survey data from API endpoints
    const [playersResponse, preSurveyResponse] = await Promise.all([
      fetch('/api/players'),
      fetch('/api/pre-survey')
    ]);

    if (!playersResponse.ok || !preSurveyResponse.ok) {
      throw new Error('Failed to fetch data from Google Sheets');
    }

    const playersData = await playersResponse.json();
    const preSurveyData = await preSurveyResponse.json();

    console.log('Loaded data from Google Sheets:', { 
      playersCount: playersData.length, 
      preSurveyCount: preSurveyData.length 
    });

    return { playersData, preSurveyData };
  } catch (error) {
    console.error('Error loading Google Sheets data:', error);
    // Fallback to default data if API fails
    console.log('Using fallback data');
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
      const { playersData, preSurveyData: preData } = await loadGoogleSheetsData();
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
    () => {
      const found = preSurveyData.find((p) => p.name.toLowerCase() === selectedPlayer.toLowerCase());
      console.log('Checking pre-survey data:', {
        selectedPlayer,
        availableNames: preSurveyData.map(p => p.name),
        found: found ? found.name : null
      });
      return found;
    },
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
    // Convert answers to proper format (preserve strings for Q17, Q18)
    const processedAnswers = Object.keys(finalAnswers).reduce((acc, key) => {
      const questionId = Number(key);
      const value = finalAnswers[questionId];
      
      // Keep string answers for questions 17 and 18, convert others to numbers
      if (questionId === 17 || questionId === 18) {
        acc[questionId] = value;
      } else {
        acc[questionId] = Number(value);
      }
      return acc;
    }, {} as Record<number, number | string>);

    const analytics = calculateAnalytics(processedAnswers, preMatch);
    const strengths = generateStrengths(analytics);
    const suggestions = generateSuggestions(analytics);

    return { analytics, strengths, suggestions };
  };

  const submitToGoogleSheets = async (payload: PostSurveySubmission) => {
    try {
      console.log("Submitting data for:", payload.player_name);
      
      // Submit post-survey answers to separate sheet
      const surveyPayload = {
        player_name: payload.player_name,
        timestamp: payload.timestamp,
        answers: payload.answers,
      };
      
      console.log("Submitting post-survey data...");
      const surveyResponse = await fetch("/api/post-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyPayload),
      });
      
      if (!surveyResponse.ok) {
        const errorData = await surveyResponse.json();
        console.error("Post-survey submission failed:", errorData);
        throw new Error(`Post-survey submission failed: ${errorData.error}`);
      }
      console.log("Post-survey data submitted successfully");
      
      // Submit detailed analytics data to separate sheet
      const analyticsPayload = {
        player_name: payload.player_name,
        timestamp: payload.timestamp,
        pre_wemwbs7_score: payload.computed_report.analytics.preWEMWBS7.standardizedScore,
        post_wemwbs7_score: payload.computed_report.analytics.postWEMWBS7.standardizedScore,
        mental_growth: payload.computed_report.analytics.mentalGrowth.score,
        confidence_index: payload.computed_report.analytics.confidenceIndex,
        physical_index: payload.computed_report.analytics.physicalIndex,
        social_index: payload.computed_report.analytics.socialIndex,
        retention_index: payload.computed_report.analytics.retentionIndex,
        tournament_impact_score: payload.computed_report.analytics.tournamentImpactScore,
        mental_growth_label: payload.computed_report.analytics.mentalGrowth.label,
        pre_wemwbs7_label: payload.computed_report.analytics.preWEMWBS7.label,
        post_wemwbs7_label: payload.computed_report.analytics.postWEMWBS7.label,
      };
      
      console.log("Submitting analytics data...");
      const analyticsResponse = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analyticsPayload),
      });
      
      if (!analyticsResponse.ok) {
        const errorData = await analyticsResponse.json();
        console.error("Analytics submission failed:", errorData);
        throw new Error(`Analytics submission failed: ${errorData.error}`);
      }
      console.log("Analytics data submitted successfully");
      
    } catch (error) {
      console.error("Submission error:", error);
      alert(`Failed to submit data: ${error.message}. Please try again.`);
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
              preSurveyData={preSurveyData}
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
              hasPreSurvey={selectedPre !== undefined}
            />
          )}
          {appState === "complete" && latestReport && selectedPre && (
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
          {appState === "complete" && latestReport && !selectedPre && (
            <div className="flex-1 flex flex-col px-6 pt-8 pb-24">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-[0_0_30px_rgba(80,244,227,0.4)] mb-6">
                  <CheckCircle className="text-on-primary w-12 h-12" />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight mb-3 text-center text-on-surface">
                  Thank You, {selectedPlayer}!
                </h2>
                <p className="text-on-surface-variant text-center mb-8 max-w-md">
                  Your post-tournament survey has been submitted successfully. Since you haven't completed the pre-tournament survey, a comparative report cannot be generated.
                </p>
                <button 
                  onClick={() => {
                    setAppState("landing");
                    setCurrentStep(0);
                    setAnswers({});
                    setNameQuery("");
                    setSelectedPlayer("");
                  }}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-extrabold uppercase tracking-widest text-sm"
                >
                  Back to Start
                </button>
              </motion.div>
            </div>
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
  preSurveyData,
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
  preSurveyData: any[];
}) {
  const validSelection = selectedPlayer.length > 0;
  const hasPreSurvey = preSurveyData.some((p) => p.name.toLowerCase() === selectedPlayer.toLowerCase());
  const showSuggestions = nameQuery && nameQuery.length > 0 && players.length > 0;
  const filteredSuggestions = players.filter((p) => 
    p.name.toLowerCase().includes(nameQuery.toLowerCase()) && 
    p.name.toLowerCase() !== nameQuery.toLowerCase()
  );

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
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="mt-2 max-h-32 overflow-auto space-y-1">
              <p className="text-[10px] text-on-surface-variant mb-1">Suggestions:</p>
              {filteredSuggestions.slice(0, 5).map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    onSelectPlayer(p.name);
                    setNameQuery(p.name);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-xs bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
          {selectedPlayer && (
            <div className="mt-2 p-2 rounded-md bg-surface-container-high">
              <p className="text-xs text-on-surface-variant">
                Selected: <span className="font-bold text-primary">{selectedPlayer}</span>
                {hasPreSurvey ? (
                  <span className="text-secondary ml-2">✓ Pre-survey found</span>
                ) : (
                  <span className="text-warning ml-2">⚠ No pre-survey data</span>
                )}
              </p>
            </div>
          )}
        </div>

        
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-lg border-l-2 border-secondary flex flex-col justify-between h-32">
            <Timer className="text-secondary w-5 h-5" />
            <div>
              <div className="text-2xl font-black text-on-surface">5:00</div>
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
        <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold opacity-60"><span className="font-black">Players who have done pre tournament survey will only get personal stats so please fill pre survey if not already done.</span></p>
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
  hasPreSurvey,
}: {
  currentStep: number;
  totalSteps: number;
  question: Question;
  selectedAnswer?: AnswerValue;
  onSelect: (val: AnswerValue) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  hasPreSurvey: boolean;
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isText = question.inputType === "text";
  const isNumber = question.inputType === "number";
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
        ) : isNumber ? (
          <div className="space-y-4">
            <div className="flex justify-center items-center mb-4">
              <span className="text-lg font-black text-primary mr-4">Selected: {selectedAnswer || question.min || 1}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: (question.max || 10) - (question.min || 1) + 1 }, (_, i) => (question.min || 1) + i).map((num) => (
                <button
                  key={num}
                  onClick={() => onSelect(num)}
                  disabled={isSubmitting}
                  className={`py-3 rounded-lg text-sm font-bold transition-all ${selectedAnswer === num ? "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_0_15px_rgba(80,244,227,0.3)] transform scale-[1.02]" : "bg-surface-container-high text-on-surface-variant hover:border-primary/50 border border-outline-variant/20"}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
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
            {isSubmitting ? "Submitting..." : currentStep === totalSteps - 1 ? (hasPreSurvey ? "Generate Report" : "Submit") : "Next Question"}
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function CompletionPage({ name, report, onReset }: { name: string; report: ComputedReport; onReset: () => void }) {
  const handleDownload = async () => {
    try {
      console.log('Starting download process...');
      
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the actual report content from the DOM
      const reportElement = document.getElementById('report-content');
      if (!reportElement) {
        throw new Error('Report content element not found');
      }
      
      // Clone the report element to avoid modifying the original
      const clonedElement = reportElement.cloneNode(true) as HTMLElement;
      clonedElement.id = 'report-content-cloned';
      
      // Style the cloned element for download
      clonedElement.style.cssText = `
        background-color: #1a1a1a;
        color: #ffffff;
        padding: 24px;
        border-radius: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        min-height: 1200px;
        width: 700px;
        position: relative;
        overflow: visible;
      `;
      
      // Temporarily add the cloned element to the DOM
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '-9999px';
      document.body.appendChild(clonedElement);
      
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      const element = clonedElement;
      
            
      try {
        // Filter out unsupported CSS properties before capture
        const filterUnsupportedCSS = (element: HTMLElement) => {
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_ELEMENT
          );
          
          const unsupportedFunctions = ['oklab', 'oklch', 'color-mix', 'lab', 'lch'];
          
          let currentNode;
          while (currentNode = walker.nextNode() as HTMLElement) {
            if (currentNode.style) {
              const style = currentNode.style;
              const computedStyle = window.getComputedStyle(currentNode);
              
              // Replace ALL inline styles that contain unsupported color functions
              for (let i = style.length - 1; i >= 0; i--) {
                const propertyName = style[i];
                const propertyValue = style.getPropertyValue(propertyName);
                
                if (propertyValue) {
                  let hasUnsupported = false;
                  for (const func of unsupportedFunctions) {
                    if (propertyValue.includes(func)) {
                      hasUnsupported = true;
                      break;
                    }
                  }
                  
                  if (hasUnsupported) {
                    // Remove the problematic property entirely
                    style.removeProperty(propertyName);
                  }
                }
              }
              
              // Check and replace computed styles
              ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'].forEach(prop => {
                const computedValue = computedStyle.getPropertyValue(prop);
                if (computedValue) {
                  let hasUnsupported = false;
                  for (const func of unsupportedFunctions) {
                    if (computedValue.includes(func)) {
                      hasUnsupported = true;
                      break;
                    }
                  }
                  if (hasUnsupported) {
                    // Replace with safe hex colors
                    if (prop.includes('background')) {
                      style.setProperty(prop, '#1a1a1a');
                    } else if (prop.includes('border')) {
                      style.setProperty(prop, '#444444');
                    } else {
                      style.setProperty(prop, '#ffffff');
                    }
                  }
                }
              });
              
              // Remove problematic CSS properties completely
              style.removeProperty('backdrop-filter');
              style.removeProperty('filter');
              style.removeProperty('mix-blend-mode');
              style.removeProperty('isolation');
              style.removeProperty('background-blend-mode');
            }
          }
        };

        // Aggressively replace all oklab colors in the entire DOM tree
        const replaceOklabColors = (element: HTMLElement) => {
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_ELEMENT
          );
          
          let currentNode;
          while (currentNode = walker.nextNode() as HTMLElement) {
            // Get the element's style attribute
            const styleAttr = currentNode.getAttribute('style');
            if (styleAttr) {
              // Replace oklab functions with safe hex colors
              let newStyle = styleAttr;
              newStyle = newStyle.replace(/oklab\([^)]*\)/g, '#ffffff');
              newStyle = newStyle.replace(/oklch\([^)]*\)/g, '#ffffff');
              newStyle = newStyle.replace(/color-mix\([^)]*\)/g, '#ffffff');
              newStyle = newStyle.replace(/lab\([^)]*\)/g, '#ffffff');
              newStyle = newStyle.replace(/lch\([^)]*\)/g, '#ffffff');
              
              // Also replace background-specific oklab colors
              newStyle = newStyle.replace(/background[^:]*:.*oklab\([^)]*\)/g, 'background-color: #1a1a1a');
              newStyle = newStyle.replace(/background[^:]*:.*oklch\([^)]*\)/g, 'background-color: #1a1a1a');
              
              currentNode.setAttribute('style', newStyle);
            }
          }
        };
        
        // Apply aggressive oklab color replacement
        replaceOklabColors(clonedElement);
        filterUnsupportedCSS(clonedElement);
        
        // Add a targeted CSS override to prevent oklab colors while preserving other styles
        const styleOverride = document.createElement('style');
        styleOverride.textContent = `
          [style*="oklab"], [style*="oklch"], [style*="color-mix"], [style*="lab"], [style*="lch"] {
            color: #ffffff !important;
            background-color: #1a1a1a !important;
            border-color: #444444 !important;
          }
          * {
            backdrop-filter: none !important;
            filter: none !important;
            mix-blend-mode: normal !important;
            background-blend-mode: normal !important;
          }
        `;
        clonedElement.appendChild(styleOverride);
        
        // Capture the cloned element with proper dimensions
        const canvas = await html2canvas(clonedElement, {
          backgroundColor: '#1a1a1a',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: 700,
          height: 1200,
          windowWidth: 700,
          windowHeight: 1200,
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc) => {
            // Add aggressive style override to the cloned document
            const globalStyle = clonedDoc.createElement('style');
            globalStyle.textContent = `
              * {
                backdrop-filter: none !important;
                filter: none !important;
                mix-blend-mode: normal !important;
                background-blend-mode: normal !important;
              }
              [style*="oklab"], [style*="oklch"], [style*="color-mix"], [style*="lab"], [style*="lch"] {
                color: #ffffff !important;
                background-color: #1a1a1a !important;
                border-color: #444444 !important;
              }
              /* Replace any remaining oklab references */
              * { color: #ffffff !important; }
              * { background-color: #1a1a1a !important; }
              * { border-color: #444444 !important; }
            `;
            clonedDoc.head.appendChild(globalStyle);
            
            // Apply aggressive replacement to cloned document
            const clonedElementInDoc = clonedDoc.getElementById('report-content-cloned');
            if (clonedElementInDoc) {
              // Apply the same aggressive replacement to the cloned document
              const replaceOklabInDoc = (element: HTMLElement) => {
                const walker = clonedDoc.createTreeWalker(
                  element,
                  NodeFilter.SHOW_ELEMENT
                );
                
                let currentNode;
                while (currentNode = walker.nextNode() as HTMLElement) {
                  const styleAttr = currentNode.getAttribute('style');
                  if (styleAttr) {
                    let newStyle = styleAttr;
                    newStyle = newStyle.replace(/oklab\([^)]*\)/g, '#ffffff');
                    newStyle = newStyle.replace(/oklch\([^)]*\)/g, '#ffffff');
                    newStyle = newStyle.replace(/color-mix\([^)]*\)/g, '#ffffff');
                    newStyle = newStyle.replace(/lab\([^)]*\)/g, '#ffffff');
                    newStyle = newStyle.replace(/lch\([^)]*\)/g, '#ffffff');
                    currentNode.setAttribute('style', newStyle);
                  }
                }
              };
              
              replaceOklabInDoc(clonedElementInDoc);
              filterUnsupportedCSS(clonedElementInDoc);
            }
          }
        });
        
        console.log('Canvas created successfully');
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${name.replace(/\s+/g, '_')}_Ziva_Report_${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('Download completed successfully');
          } else {
            console.error('Failed to create blob from canvas');
            alert('Failed to generate report image. Please try again.');
          }
        }, 'image/png');
        
      } finally {
        // Clean up
        if (clonedElement && clonedElement.parentNode) {
          clonedElement.parentNode.removeChild(clonedElement);
        }
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(`Failed to download report: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col px-6 pt-8 pb-24">
      <div className="relative mb-8 self-center">
        <div className="absolute -inset-4 bg-secondary/20 rounded-full blur-xl" />
        <div className="w-24 h-24 rounded-full border-4 border-gradient-to-r from-secondary to-primary flex items-center justify-center shadow-[0_0_30px_rgba(46,253,124,0.4)] p-2" style={{ borderColor: '#00f4e3', borderWidth: '3px' }}>
          <img src="/logo.svg" alt="Ziva Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      <div id="report-content" className="bg-surface-container-low p-6 rounded-lg shadow-lg mb-6 border border-outline-variant/20" style={{ backgroundColor: '#1a1a1a', minHeight: '700px' }}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-on-surface" style={{ color: '#ffffff' }}>
            {name}
          </h2>
          <p className="text-lg font-bold text-primary mt-1" style={{ color: '#00f4e3' }}>Ziva Tournament Analytics Report</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-card p-4 rounded-lg border-l-2 border-primary">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#00f4e3' }}>Pre WEMWBS-7</p>
            <p className="text-2xl font-black text-primary" style={{ color: '#00f4e3' }}>{report.analytics.preWEMWBS7.standardizedScore}</p>
            <p className="text-xs text-on-surface-variant mt-1" style={{ color: '#e0e0e0' }}>{report.analytics.preWEMWBS7.label}</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-secondary">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#2efd7c' }}>Post WEMWBS-7</p>
            <p className="text-2xl font-black text-secondary" style={{ color: '#2efd7c' }}>{report.analytics.postWEMWBS7.standardizedScore}</p>
            <p className="text-xs text-on-surface-variant mt-1" style={{ color: '#e0e0e0' }}>{report.analytics.postWEMWBS7.label}</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-blue-500">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#6366f1' }}>Mental Growth</p>
            <p className="text-2xl font-black" style={{ color: '#6366f1' }}>
              {report.analytics.mentalGrowth.score > 0 ? '+' : ''}{report.analytics.mentalGrowth.score}
            </p>
            <p className="text-xs text-on-surface-variant mt-1" style={{ color: '#e0e0e0' }}>{report.analytics.mentalGrowth.label}</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-amber-500">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>CONFIDENCE SCORE</p>
            <p className="text-2xl font-black" style={{ color: '#f59e0b' }}>{report.analytics.confidenceIndex}%</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-red-500">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>PHYSICAL SCORE</p>
            <p className="text-2xl font-black" style={{ color: '#ef4444' }}>{report.analytics.physicalIndex}%</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-purple-500">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#8b5cf6' }}>SOCIAL SCORE</p>
            <p className="text-2xl font-black" style={{ color: '#8b5cf6' }}>{report.analytics.socialIndex}%</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-cyan-500">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#06b6d4' }}>RETENTION SCORE</p>
            <p className="text-2xl font-black" style={{ color: '#06b6d4' }}>{report.analytics.retentionIndex}%</p>
          </div>
          <div className="glass-card p-4 rounded-lg border-l-2 border-green-500">
            <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1" style={{ color: '#10b981' }}>Tournament Impact</p>
            <p className="text-2xl font-black" style={{ color: '#10b981' }}>{report.analytics.tournamentImpactScore}%</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-lg mb-4 bg-surface-container-high" style={{ backgroundColor: '#2a2a2a' }}>
          <p className="font-bold mb-3 text-on-surface flex items-center gap-2" style={{ color: '#ffffff' }}>
            <Award className="w-4 h-4 text-primary" style={{ color: '#00f4e3' }} />
            Strengths
          </p>
          {report.strengths.map((item) => <p className="text-sm text-on-surface-variant mb-1" style={{ color: '#e0e0e0' }} key={item}>• {item}</p>)}
        </div>
        <div className="glass-card p-4 rounded-lg mb-4 bg-surface-container-high" style={{ backgroundColor: '#2a2a2a' }}>
          <p className="font-bold mb-3 text-on-surface flex items-center gap-2" style={{ color: '#ffffff' }}>
            <Lightbulb className="w-4 h-4 text-secondary" style={{ color: '#2efd7c' }} />
            Suggested Next Steps
          </p>
          {report.suggestions.map((item) => <p className="text-sm text-on-surface-variant mb-1" style={{ color: '#e0e0e0' }} key={item}>• {item}</p>)}
        </div>
        <div className="glass-card p-4 rounded-lg mb-4 bg-surface-container-high" style={{ backgroundColor: '#1f2937', border: '1px solid #444' }}>
          <p className="font-bold mb-3 text-on-surface flex items-center gap-2" style={{ color: '#ffffff' }}>
            📊 Assessment Methodology
          </p>
          <p className="text-sm text-on-surface-variant mb-2" style={{ color: '#e0e0e0' }}>
            This report uses WEMWBS-7 for mental wellbeing assessment.
          </p>
          <p className="text-sm text-on-surface-variant mb-2" style={{ color: '#e0e0e0' }}>
            Tournament Impact Score is weighted across multiple development indices.
          </p>
          <p className="text-sm text-on-surface-variant" style={{ color: '#e0e0e0' }}>
            All scores are normalized to 0-100 scale for comparison.
          </p>
        </div>
        <div className="text-center text-xs text-on-surface-variant mt-4 pt-4 border-t border-outline-variant/20" style={{ color: '#00f4e3', borderTopColor: '#444' }}>
          Generated on {new Date().toLocaleDateString()}
          <p className="text-xs mt-1" style={{ color: '#e0e0e0' }}>Powered by Ziva Analytics</p>
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
  
  const cohortAnalytics = useMemo(() => {
    if (submissions.length === 0) return null;
    
    const preWEMWBS7Scores = submissions.map(s => s.computed_report.analytics.preWEMWBS7.standardizedScore);
    const postWEMWBS7Scores = submissions.map(s => s.computed_report.analytics.postWEMWBS7.standardizedScore);
    const mentalGrowthScores = submissions.map(s => s.computed_report.analytics.mentalGrowth.score);
    const confidenceIndices = submissions.map(s => s.computed_report.analytics.confidenceIndex);
    const physicalIndices = submissions.map(s => s.computed_report.analytics.physicalIndex);
    const socialIndices = submissions.map(s => s.computed_report.analytics.socialIndex);
    const retentionIndices = submissions.map(s => s.computed_report.analytics.retentionIndex);
    const tournamentImpactScores = submissions.map(s => s.computed_report.analytics.tournamentImpactScore);
    
    const improvementDistribution = {
      strongImprovement: mentalGrowthScores.filter(score => score >= 15).length,
      moderateImprovement: mentalGrowthScores.filter(score => score >= 5 && score < 15).length,
      stable: mentalGrowthScores.filter(score => score >= -4 && score < 5).length,
      decline: mentalGrowthScores.filter(score => score < -4).length,
    };
    
    return {
      averagePreWEMWBS7: avg(preWEMWBS7Scores),
      averagePostWEMWBS7: avg(postWEMWBS7Scores),
      averageMentalGrowth: avg(mentalGrowthScores),
      averageConfidenceIndex: avg(confidenceIndices),
      averagePhysicalIndex: avg(physicalIndices),
      averageSocialIndex: avg(socialIndices),
      averageRetentionIndex: avg(retentionIndices),
      averageTournamentImpactScore: avg(tournamentImpactScores),
      improvementDistribution,
    };
  }, [submissions]);
  
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
      <h2 className="text-xl font-black mb-2">Tournament Analytics Dashboard</h2>
      
      {cohortAnalytics && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard label="Total Players" value={String(total)} icon={<Users className="w-4 h-4 text-secondary" />} />
            <MetricCard label="Avg Tournament Impact" value={`${cohortAnalytics.averageTournamentImpactScore}%`} icon={<Target className="w-4 h-4 text-primary" />} />
          </div>
          
          <div className="glass-card p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-3 text-on-surface flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Mental Wellbeing (WEMWBS-7)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Avg Pre-Score" value={`${cohortAnalytics.averagePreWEMWBS7}`} />
              <MetricCard label="Avg Post-Score" value={`${cohortAnalytics.averagePostWEMWBS7}`} />
              <MetricCard label="Avg Growth" value={`${cohortAnalytics.averageMentalGrowth > 0 ? '+' : ''}${cohortAnalytics.averageMentalGrowth}`} />
            </div>
          </div>
          
          <div className="glass-card p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-3 text-on-surface flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Development Indices
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Confidence Index" value={`${cohortAnalytics.averageConfidenceIndex}%`} />
              <MetricCard label="Physical Index" value={`${cohortAnalytics.averagePhysicalIndex}%`} />
              <MetricCard label="Social Index" value={`${cohortAnalytics.averageSocialIndex}%`} />
              <MetricCard label="Retention Index" value={`${cohortAnalytics.averageRetentionIndex}%`} />
            </div>
          </div>
          
          <div className="glass-card p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-3 text-on-surface">Mental Growth Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Strong Improvement (≥15)</span>
                <span className="font-bold text-green-500">{cohortAnalytics.improvementDistribution.strongImprovement}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Moderate Improvement (5-14)</span>
                <span className="font-bold text-blue-500">{cohortAnalytics.improvementDistribution.moderateImprovement}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Stable (-4 to 4)</span>
                <span className="font-bold text-yellow-500">{cohortAnalytics.improvementDistribution.stable}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">Decline (≤-5)</span>
                <span className="font-bold text-red-500">{cohortAnalytics.improvementDistribution.decline}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MetricCard label="Participation Intent (Yes %)" value={`${participationIntent}%`} />
            <MetricCard label="Most Requested Sport" value={mostRequestedFutureSport} />
          </div>
        </>
      )}
      
      {!cohortAnalytics && (
        <div className="glass-card p-6 rounded-lg text-center">
          <p className="text-on-surface-variant">No submissions yet. Analytics will appear here once players complete the survey.</p>
        </div>
      )}
      
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
