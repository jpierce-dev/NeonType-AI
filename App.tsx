import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import confetti from 'canvas-confetti';
import { z } from 'zod';
import { DrillHistoryItem, PracticeHistoryItem, Difficulty, GameStatus, GameStats, GameMode, DrillDifficulty, KeystrokeData, KeyAnalytics } from './types';
import { fetchPracticeText } from './services/geminiService';
import { logAppEvent } from './services/firebase';
import { StatsBoard } from './components/StatsBoard';
import { TypingArea } from './components/TypingArea';
import { DrillArea } from './components/DrillArea';
import { HistoryModal } from './components/HistoryModal';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FinishModal } from './components/FinishModal';
import { playClickSound } from './utils/sound';
import { RefreshCw } from 'lucide-react';


// --- Main App ---

const App: React.FC = () => {
  // Global View State
  const [mode, setMode] = useState<GameMode>(GameMode.DRILL);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Persistence State
  const [drillHistory, setDrillHistory] = useState<DrillHistoryItem[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryItem[]>([]);

  // Practice Configuration
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NOVICE);
  const [targetText, setTargetText] = useState<string>("Loading...");

  // Drill Configuration
  const [drillDifficulty, setDrillDifficulty] = useState<DrillDifficulty>(DrillDifficulty.HOME_ROW);
  // Dynamic Title for SEO
  useEffect(() => {
    const modeName = mode === GameMode.PRACTICE ? 'Practice' : 'Drill';
    document.title = `${modeName} Mode | NeonType AI - Keyboard Typing Trainer`;
  }, [mode]);

  // Session State with Reducer
  interface SessionState {
    status: GameStatus;
    startTime: number | null;
    stats: GameStats;
    userInput: string;
    keystrokes: KeystrokeData[];
  }

  type SessionAction =
    | { type: 'INIT'; status: GameStatus }
    | { type: 'START'; startTime: number }
    | { type: 'UPDATE'; userInput: string; stats: Partial<GameStats>; keystroke?: KeystrokeData }
    | { type: 'FINISH'; status: GameStatus; finalStats?: Partial<GameStats> }
    | { type: 'SET_TIME'; timeElapsed: number; wpm: number };

  const initialSession: SessionState = {
    status: GameStatus.IDLE,
    startTime: null,
    stats: { wpm: 0, accuracy: 100, timeElapsed: 0, errors: 0, totalChars: 0 },
    userInput: "",
    keystrokes: []
  };

  const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
    switch (action.type) {
      case 'INIT':
        return { ...initialSession, status: action.status };
      case 'START':
        return { ...state, status: GameStatus.PLAYING, startTime: action.startTime };
      case 'UPDATE':
        return {
          ...state,
          userInput: action.userInput,
          stats: { ...state.stats, ...action.stats },
          keystrokes: action.keystroke ? [...state.keystrokes, action.keystroke] : state.keystrokes
        };
      case 'FINISH':
        return { ...state, status: action.status, stats: { ...state.stats, ...action.finalStats } };
      case 'SET_TIME':
        return { ...state, stats: { ...state.stats, timeElapsed: action.timeElapsed, wpm: action.wpm } };
      default:
        return state;
    }
  };

  const [session, dispatch] = useReducer(sessionReducer, initialSession);
  const { status, startTime, stats, userInput } = session;

  const timerRef = useRef<number | null>(null);
  const totalCharsRef = useRef(0);

  // --- Persistence ---

  useEffect(() => {
    logAppEvent('page_view', { page_title: 'Home' });

    // Zod schemas for localStorage validation
    const DrillHistorySchema = z.array(z.object({
      timestamp: z.number(),
      difficulty: z.nativeEnum(DrillDifficulty),
      score: z.number(),
      accuracy: z.number(),
      duration: z.number()
    }));

    const KeyAnalyticsSchema = z.record(z.string(), z.object({
      total: z.number(),
      errors: z.number(),
      avgLatency: z.number()
    }));

    const PracticeHistorySchema = z.array(z.object({
      timestamp: z.number(),
      difficulty: z.nativeEnum(Difficulty),
      wpm: z.number(),
      accuracy: z.number(),
      duration: z.number(),
      analytics: KeyAnalyticsSchema.optional()
    })) as z.ZodType<PracticeHistoryItem[]>;

    const savedDrill = localStorage.getItem('drill_history');
    if (savedDrill) {
      try {
        const parsed = DrillHistorySchema.safeParse(JSON.parse(savedDrill));
        if (parsed.success) setDrillHistory(parsed.data);
        else console.warn('Invalid drill history data:', parsed.error);
      } catch (e) { console.error(e); }
    }

    const savedPractice = localStorage.getItem('practice_history');
    if (savedPractice) {
      try {
        const parsed = PracticeHistorySchema.safeParse(JSON.parse(savedPractice));
        if (parsed.success) setPracticeHistory(parsed.data);
        else console.warn('Invalid practice history data:', parsed.error);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (drillHistory.length > 0) localStorage.setItem('drill_history', JSON.stringify(drillHistory));
  }, [drillHistory]);

  useEffect(() => {
    if (practiceHistory.length > 0) localStorage.setItem('practice_history', JSON.stringify(practiceHistory));
  }, [practiceHistory]);

  const saveDrillSession = useCallback((item: DrillHistoryItem) => {
    setDrillHistory(prev => [item, ...prev].slice(0, 20));
  }, []);

  const savePracticeSession = useCallback((item: PracticeHistoryItem) => {
    setPracticeHistory(prev => [item, ...prev].slice(0, 20));
  }, []);

  // --- Game Logic ---

  const initGame = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === GameMode.PRACTICE) {
      dispatch({ type: 'INIT', status: GameStatus.LOADING });
      const text = await fetchPracticeText(difficulty);
      setTargetText(text);
      dispatch({ type: 'INIT', status: GameStatus.IDLE });
      logAppEvent('practice_round_init', { difficulty });
    } else {
      dispatch({ type: 'INIT', status: GameStatus.IDLE });
      logAppEvent('drill_round_init', { difficulty: drillDifficulty });
    }
  }, [difficulty, mode, drillDifficulty]);

  useEffect(() => {
    initGame();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [initGame]);

  // --- Global Handlers ---

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        initGame();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [initGame]);

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  // --- Timer ---

  // Sync totalChars to ref for timer access without causing useEffect re-runs
  useEffect(() => {
    totalCharsRef.current = stats.totalChars;
  }, [stats.totalChars]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && startTime) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.floor((now - startTime) / 1000);
        const wpm = elapsedSec > 0 ? Math.round((totalCharsRef.current / 5) / (elapsedSec / 60)) : 0;
        dispatch({ type: 'SET_TIME', timeElapsed: elapsedSec, wpm });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, startTime]);

  // --- Input Handlers ---

  const handlePracticeInput = useCallback((input: string) => {
    if (status === GameStatus.FINISHED || status === GameStatus.LOADING) return;

    if (status === GameStatus.IDLE) {
      dispatch({ type: 'START', startTime: Date.now() });
      logAppEvent('practice_start', { difficulty });
    }

    if (soundEnabled) playClickSound();

    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== targetText[i]) errors++;
    }

    const accuracy = input.length > 0
      ? Math.max(0, Math.round(((input.length - errors) / input.length) * 100))
      : 100;

    const lastKeystroke = session.keystrokes[session.keystrokes.length - 1];
    const now = Date.now();
    const latency = lastKeystroke ? now - lastKeystroke.timestamp : 0;

    const keystroke: KeystrokeData = {
      key: input[input.length - 1],
      timestamp: now,
      isCorrect: input[input.length - 1] === targetText[input.length - 1],
      latency
    };

    const newStats = { errors, accuracy, totalChars: input.length };
    dispatch({ type: 'UPDATE', userInput: input, stats: newStats, keystroke });

    if (input.length === targetText.length) {
      const st = startTime || now;
      const elapsedSec = Math.floor((now - st) / 1000);
      const finalWpm = elapsedSec > 0 ? Math.round((input.length / 5) / (elapsedSec / 60)) : 0;
      finishGame({ ...newStats, wpm: finalWpm });
    }
  }, [status, targetText, soundEnabled, startTime, difficulty]);

  const handleDrillStart = useCallback(() => {
    if (status === GameStatus.IDLE) {
      dispatch({ type: 'START', startTime: Date.now() });
      logAppEvent('drill_start', { difficulty: drillDifficulty });
    }
  }, [status, drillDifficulty]);

  const finishGame = useCallback((finalStats?: Partial<GameStats>) => {
    dispatch({ type: 'FINISH', status: GameStatus.FINISHED, finalStats });
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === GameMode.PRACTICE) {
      // Calculate Analytics for Heatmap
      const analytics: KeyAnalytics = {};
      session.keystrokes.forEach(ks => {
        const char = ks.key.toLowerCase();
        if (!analytics[char]) {
          analytics[char] = { total: 0, errors: 0, avgLatency: 0 };
        }
        analytics[char].total++;
        if (!ks.isCorrect) analytics[char].errors++;
        // Moving average for latency
        analytics[char].avgLatency = (analytics[char].avgLatency * (analytics[char].total - 1) + ks.latency) / analytics[char].total;
      });

      try {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#BC13FE', '#22c55e', '#ffffff'],
          zIndex: 100
        });
      } catch (e) { console.error(e); }

      if (finalStats && (finalStats.totalChars ?? stats.totalChars) > 10) {
        const now = Date.now();
        const dur = startTime ? Math.floor((now - startTime) / 1000) : 0;
        logAppEvent('practice_finish', { difficulty, wpm: finalStats.wpm, accuracy: finalStats.accuracy, duration: dur });
        savePracticeSession({
          timestamp: now,
          difficulty,
          wpm: finalStats.wpm ?? 0,
          accuracy: finalStats.accuracy ?? 100,
          duration: dur,
          analytics // Save analytics
        });
      }
    } else {
      logAppEvent('drill_finish', { difficulty: drillDifficulty });
    }
  }, [mode, startTime, difficulty, drillDifficulty, savePracticeSession, stats.totalChars, session.keystrokes]);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 flex flex-col items-center p-4 selection:bg-neon-blue/30 selection:text-white overflow-y-auto">
      <Header
        mode={mode} setMode={setMode}
        soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
        isFullScreen={isFullScreen} toggleFullScreen={toggleFullScreen}
        setIsHistoryOpen={setIsHistoryOpen}
        difficulty={difficulty} setDifficulty={setDifficulty}
        drillDifficulty={drillDifficulty} setDrillDifficulty={setDrillDifficulty}
        status={status}
      />

      <main className="w-full max-w-7xl flex flex-col items-center z-10 mt-8 md:mt-16 mb-20 flex-grow">
        {mode === GameMode.PRACTICE ? (
          <>
            <StatsBoard stats={stats} />
            <div className="w-full flex justify-center relative mt-4">
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-neon-purple/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-neon-blue/20 rounded-full blur-3xl"></div>
              <TypingArea
                targetText={targetText}
                userInput={userInput}
                status={status}
                onInputChange={handlePracticeInput}
              />
            </div>
          </>
        ) : (
          <div className="w-full relative mt-4">
            <DrillArea
              difficulty={drillDifficulty}
              status={status}
              soundEnabled={soundEnabled}
              onStart={handleDrillStart}
              onFinish={finishGame}
              onSessionComplete={saveDrillSession}
              timeElapsed={stats.timeElapsed}
            />
          </div>
        )}

        <div className="mt-12 flex gap-4">
          <button
            onClick={initGame}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 group"
          >
            <RefreshCw className={`w-5 h-5 ${status === GameStatus.LOADING ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>Reset / New Round</span>
          </button>
        </div>
      </main>

      <Footer />

      {status === GameStatus.FINISHED && mode === GameMode.PRACTICE && (
        <FinishModal stats={stats} onPlayAgain={initGame} />
      )}

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        mode={mode}
        drillHistory={drillHistory}
        practiceHistory={practiceHistory}
      />
    </div>
  );
};

export default App;