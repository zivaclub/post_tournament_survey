import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bolt, CheckCircle, ChevronRight, Timer, Award, BarChart3, Lightbulb, Users, Gauge, Dumbbell, User, Share2, TrendingUp } from 'lucide-react';
import { QUESTIONS } from './constants';
import { AppState } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [appState, currentStep]);

  const handleStart = () => {
    if (username.trim()) {
      setAppState('survey');
    }
  };

  const submitToGoogleSheets = async (finalAnswers: Record<number, number>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          answers: finalAnswers,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to submit');
      setAppState('complete');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit your results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitToGoogleSheets(answers);
    }
  };
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setAppState('landing');
    }
  };

  const handleSelect = (value: number) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[currentStep].id]: value }));
  };

  const handleExit = () => {
    if (appState === 'survey' && Object.keys(answers).length > 0) {
      submitToGoogleSheets(answers);
    } else {
      setAppState('landing');
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden bg-background selection:bg-primary selection:text-on-primary">
      <Header onExit={handleExit} />
      
      <main className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {appState === 'landing' && (
            <LandingPage 
              key="landing" 
              onStart={handleStart} 
              username={username} 
              setUsername={setUsername} 
            />
          )}
          {appState === 'survey' && (
            <SurveyPage 
              key="survey"
              currentStep={currentStep}
              totalSteps={QUESTIONS.length}
              question={QUESTIONS[currentStep]}
              selectedAnswer={answers[QUESTIONS[currentStep].id]}
              onSelect={handleSelect}
              onNext={handleNext}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
          {appState === 'complete' && (
            <CompletionPage key="complete" onReset={() => {
              setAppState('landing');
              setCurrentStep(0);
              setAnswers({});
              setUsername('');
            }} />
          )}
        </AnimatePresence>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-24 w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
    </div>
  );
}

function Header({ onExit }: { onExit: () => void }) {
  return (
    <header className="bg-surface-container-low text-primary shadow-[0_32px_32px_rgba(186,246,245,0.08)] flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Bolt className="w-6 h-6" />
        <h1 className="font-manrope font-black uppercase tracking-tight text-xl">ZIVA CLUB</h1>
      </div>
      <button 
        onClick={onExit}
        className="font-manrope font-extrabold uppercase tracking-tight text-white hover:text-secondary transition-colors duration-200 active:scale-95 text-sm"
      >
        Save & Exit
      </button>
    </header>
  );
}

function LandingPage({ 
  onStart, 
  username, 
  setUsername 
}: { 
  onStart: () => void; 
  username: string; 
  setUsername: (val: string) => void;
  key?: string;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col pb-32"
    >
      <section className="relative w-full h-[480px] flex flex-col justify-end px-6 pb-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop" 
            alt="Athlete" 
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-highest border border-outline-variant/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#2efd7c]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">DMSIE CUP 2</span>
          </div>
          <h1 className="text-[3rem] font-black leading-[0.9] tracking-tighter mb-4 italic">
            LET THE <span className="text-primary">GAME</span><br />COME TO <span className="text-secondary">YOU.</span>
          </h1>
          <p className="text-on-surface-variant max-w-[90%] leading-relaxed text-sm">
            Welcome to the official ZIVA CLUB pre-tournament survey. Your vitals help us optimize the elite sports analytics engine for the upcoming competition.
          </p>
        </div>
      </section>

      <section className="px-6 -mt-6 relative z-20 space-y-3">
        <div className="glass-card p-5 rounded-lg border-l-2 border-primary">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
            Athlete Username
          </label>
          <input 
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name..."
            className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary transition-colors text-sm"
          />
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
              <div className="text-2xl font-black text-on-surface">PRO</div>
              <div className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Report</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 px-6 flex flex-col items-center">
        <button 
          onClick={onStart}
          disabled={!username.trim()}
          className="w-full bg-gradient-to-r from-primary to-primary-container py-4 rounded-full text-on-primary font-black uppercase tracking-[0.15em] text-base shadow-[0_15px_30px_rgba(80,244,227,0.2)] active:scale-95 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Survey
        </button>
        <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold opacity-60">
          Pre-Tournament Data Collection
        </p>
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
  isSubmitting
}: { 
  currentStep: number;
  totalSteps: number;
  question: typeof QUESTIONS[0];
  selectedAnswer?: number;
  onSelect: (val: number) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  key?: string;
}) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      className="flex-1 flex flex-col px-6 pt-8 pb-12 mesh-gradient"
    >
      <div className="mb-8">
        <div className="flex justify-between items-end mb-3">
          <span className="font-bold text-primary uppercase tracking-widest text-[10px]">Progress</span>
          <span className="font-extrabold text-on-surface text-base">
            {currentStep + 1}<span className="text-on-surface-variant font-normal text-xs ml-1">/ {totalSteps}</span>
          </span>
        </div>
        <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-secondary to-primary shadow-[0_0_10px_rgba(80,244,227,0.4)]"
          />
        </div>
      </div>

      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">{question.category}</h2>
          <p className="font-extrabold text-xl leading-tight text-on-surface">
            {question.text}
          </p>
        </div>

        {question.highlight && (
          <div className="bg-surface-container-low rounded-lg p-6 border-l-4 border-secondary kinetic-glow">
            <p className="text-lg font-bold italic text-tertiary">
              "{question.highlight}"
            </p>
          </div>
        )}

        {question.image && (
          <div className="rounded-lg overflow-hidden h-32 relative group">
            <img 
              src={question.image} 
              alt="Context" 
              className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            {question.hint && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Lightbulb className="text-secondary w-3 h-3" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{question.hint}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((opt) => (
            <button 
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              disabled={isSubmitting}
              className={`flex items-center justify-between p-4 rounded-lg transition-all active:scale-[0.98] group ${
                selectedAnswer === opt.value 
                  ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_0_15px_rgba(80,244,227,0.3)] transform scale-[1.01]' 
                  : 'bg-surface-container-high border border-outline-variant/20 hover:border-primary/50'
              }`}
            >
              <span className={`font-bold text-sm ${selectedAnswer === opt.value ? 'text-on-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                {opt.label}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm transition-colors ${
                selectedAnswer === opt.value 
                  ? 'bg-on-primary/20 text-on-primary' 
                  : 'bg-surface-container-highest text-on-surface group-hover:bg-primary group-hover:text-on-primary'
              }`}>
                {opt.value}
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-full bg-surface-container-highest text-primary border border-outline-variant/30 font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-surface-variant disabled:opacity-50"
          >
            Back
          </button>
          <button 
            onClick={onNext}
            disabled={!selectedAnswer || isSubmitting}
            className={`flex-[2] py-3 px-4 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all ${
              selectedAnswer && !isSubmitting
                ? 'bg-gradient-to-r from-secondary to-primary-container text-on-primary' 
                : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : (currentStep === totalSteps - 1 ? 'Finish' : 'Next Question')}
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function CompletionPage({ onReset }: { onReset: () => void; key?: string }) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-24 relative"
    >
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-secondary/20 rounded-full blur-xl" />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-[0_0_30px_rgba(46,253,124,0.4)]">
          <CheckCircle className="text-on-primary w-12 h-12" />
        </div>
      </div>

      <h2 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight text-center">
        Progress Saved & <br />
        <span className="text-secondary">Survey Complete!</span>
      </h2>
      <p className="text-on-surface-variant text-lg max-w-xs mx-auto text-center mb-12">
        Your performance data has been synchronized with the cloud.
      </p>

      <div className="w-full grid grid-cols-2 gap-4 mb-10">
        <div className="col-span-2 relative overflow-hidden rounded-lg bg-surface-container-high p-6 flex flex-col justify-between h-48">
          <div className="absolute left-0 top-6 bottom-6 w-1 bg-secondary rounded-r-full" />
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-surface-variant text-secondary text-[10px] font-bold uppercase tracking-[0.2em] mb-4">New Report Ready</span>
            <h3 className="text-2xl font-extrabold leading-tight mb-2 text-on-surface">Custom Performance Insights</h3>
            <p className="text-sm text-on-surface-variant">We've analyzed your results against 1,200 pro data points.</p>
          </div>
          <BarChart3 className="absolute right-[-20px] bottom-[-20px] w-32 h-32 text-primary opacity-20 rotate-12" />
        </div>

        <div className="bg-surface-container-low rounded-lg p-4 flex flex-col gap-2 relative group overflow-hidden">
          <Gauge className="text-primary w-5 h-5" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Flow State</div>
            <div className="text-2xl font-extrabold text-on-surface">94%</div>
          </div>
        </div>
        <div className="bg-surface-container-low rounded-lg p-4 flex flex-col gap-2 relative group overflow-hidden">
          <TrendingUp className="text-secondary w-5 h-5" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Efficiency</div>
            <div className="text-2xl font-extrabold text-on-surface">+12.4</div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        <button 
          onClick={onReset}
          className="w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-extrabold uppercase tracking-widest text-sm shadow-[0_15px_30px_rgba(80,244,227,0.3)] active:scale-[0.98] transition-all"
        >
          Back to Dashboard
        </button>
        <button className="w-full py-4 rounded-full bg-surface-container-highest border border-outline-variant/20 text-on-surface font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <Share2 className="w-4 h-4" />
          Share Achievements
        </button>
      </div>
    </motion.div>
  );
}
