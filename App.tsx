import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DrillHistoryItem, PracticeHistoryItem, Difficulty, GameStatus, GameStats, GameMode, DrillDifficulty } from './types';
import { fetchPracticeText } from './services/geminiService';
import { StatsBoard } from './components/StatsBoard';
import { TypingArea } from './components/TypingArea';
import { DrillArea } from './components/DrillArea';
import { HistoryModal } from './components/HistoryModal';
import { playClickSound } from './utils/sound';
import { RefreshCw, Trophy, Keyboard, Gamepad2, Type, Maximize2, Minimize2, Volume2, VolumeX, History } from 'lucide-react';

const App: React.FC = () => {
  // Global State
  const [mode, setMode] = useState<GameMode>(GameMode.DRILL);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // History State
  const [drillHistory, setDrillHistory] = useState<DrillHistoryItem[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryItem[]>([]);

  // Practice Mode State
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NOVICE);
  const [targetText, setTargetText] = useState<string>("Loading...");
  const [userInput, setUserInput] = useState<string>("");

  // Drill Mode State
  const [drillDifficulty, setDrillDifficulty] = useState<DrillDifficulty>(DrillDifficulty.HOME_ROW);

  // Shared Stats
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stats, setStats] = useState<GameStats>({
    wpm: 0,
    accuracy: 100,
    timeElapsed: 0,
    errors: 0,
    totalChars: 0
  });

  const timerRef = useRef<number | null>(null);

  // --- Persistence ---

  useEffect(() => {
    // Load Drill History
    const savedDrill = localStorage.getItem('drill_history');
    if (savedDrill) {
      try { setDrillHistory(JSON.parse(savedDrill)); } catch (e) { console.error(e); }
    }

    // Load Practice History
    const savedPractice = localStorage.getItem('practice_history');
    if (savedPractice) {
      try { setPracticeHistory(JSON.parse(savedPractice)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveDrillSession = useCallback((item: DrillHistoryItem) => {
    setDrillHistory(prev => {
      const updated = [item, ...prev].slice(0, 20);
      localStorage.setItem('drill_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const savePracticeSession = useCallback((item: PracticeHistoryItem) => {
    setPracticeHistory(prev => {
      const updated = [item, ...prev].slice(0, 20);
      localStorage.setItem('practice_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const initGame = useCallback(async () => {
    setStatus(GameStatus.LOADING);
    setStartTime(null);
    if (timerRef.current) clearInterval(timerRef.current);

    // Reset Stats
    setStats({ wpm: 0, accuracy: 100, timeElapsed: 0, errors: 0, totalChars: 0 });

    if (mode === GameMode.PRACTICE) {
      setUserInput("");
      const text = await fetchPracticeText(difficulty);
      setTargetText(text);
      setStatus(GameStatus.IDLE);
    } else {
      // Drill mode is instant
      setStatus(GameStatus.IDLE);
    }
  }, [difficulty, mode]);

  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initGame]);

  // --- Global Key Handlers ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault(); // Prevent focus navigation
        initGame();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [initGame]);

  // --- Fullscreen Logic ---
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // --- Timer & Logic ---

  useEffect(() => {
    if (status === GameStatus.PLAYING && startTime) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.floor((now - startTime) / 1000);

        setStats(prev => ({
          ...prev,
          timeElapsed: elapsedSec,
          wpm: elapsedSec > 0 ? Math.round((prev.totalChars / 5) / (elapsedSec / 60)) : 0
        }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, startTime]);

  // --- Handlers ---

  const handlePracticeInput = (input: string) => {
    if (status === GameStatus.FINISHED || status === GameStatus.LOADING) return;

    // Play sound if input length increased (typing)
    if (soundEnabled && input.length > userInput.length) {
      playClickSound();
    }

    if (status === GameStatus.IDLE) {
      setStatus(GameStatus.PLAYING);
      setStartTime(Date.now());
    }

    let errors = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] !== targetText[i]) errors++;
    }

    const accuracy = input.length > 0
      ? Math.max(0, Math.round(((input.length - errors) / input.length) * 100))
      : 100;

    setUserInput(input);
    setStats(prev => ({ ...prev, errors, accuracy, totalChars: input.length }));

    if (input.length === targetText.length) finishGame();
  };

  const handleDrillStart = () => {
    if (status === GameStatus.IDLE) {
      setStatus(GameStatus.PLAYING);
      setStartTime(Date.now());
    }
  };

  const finishGame = () => {
    setStatus(GameStatus.FINISHED);
    if (timerRef.current) clearInterval(timerRef.current);

    // Save Practice History if applicable
    if (mode === GameMode.PRACTICE && startTime) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (stats.totalChars > 10) { // Only save if they actually typed something substantial
        savePracticeSession({
          timestamp: Date.now(),
          difficulty,
          wpm: stats.wpm,
          accuracy: stats.accuracy,
          duration: duration
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-200 flex flex-col items-center p-4 selection:bg-neon-blue/30 selection:text-white overflow-y-auto">

      {/* Header */}
      <header className="w-full max-w-7xl p-6 flex flex-col md:flex-row gap-6 justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg shadow-[0_0_15px_rgba(188,19,254,0.4)]">
            <Keyboard className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            NeonType<span className="text-neon-blue">.ai</span>
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">

          <div className="flex items-center gap-4">
            {/* Mode Switcher */}
            <div className="bg-dark-surface/80 p-1 rounded-lg border border-white/10 flex">
              <button
                onClick={() => setMode(GameMode.PRACTICE)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === GameMode.PRACTICE ? 'bg-neon-blue text-black shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Type className="w-4 h-4" /> Practice
              </button>
              <button
                onClick={() => setMode(GameMode.DRILL)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === GameMode.DRILL ? 'bg-neon-purple text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
              >
                <Gamepad2 className="w-4 h-4" /> Drill
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-lg border border-white/10 bg-dark-surface/80 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title={soundEnabled ? "Mute Sound" : "Enable Sound"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullScreen}
              className="p-2.5 rounded-lg border border-white/10 bg-dark-surface/80 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="Toggle Fullscreen"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* History Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2.5 rounded-lg border border-white/10 bg-dark-surface/80 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              title="View History"
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          {/* Difficulty Selector */}
          <div className="flex bg-dark-surface border border-white/10 rounded-lg p-1 overflow-x-auto max-w-[300px] md:max-w-none scrollbar-hide">
            {mode === GameMode.PRACTICE ? (
              (Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(Difficulty[level])}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-300 ${difficulty === Difficulty[level]
                    ? 'bg-white text-black shadow-lg'
                    : 'text-slate-500 hover:text-white'
                    }`}
                  disabled={status === GameStatus.PLAYING}
                >
                  {Difficulty[level]}
                </button>
              ))
            ) : (
              (Object.keys(DrillDifficulty) as Array<keyof typeof DrillDifficulty>).map((level) => (
                <button
                  key={level}
                  onClick={() => setDrillDifficulty(DrillDifficulty[level])}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-300 ${drillDifficulty === DrillDifficulty[level]
                    ? 'bg-white text-black shadow-lg'
                    : 'text-slate-500 hover:text-white'
                    }`}
                  disabled={status === GameStatus.PLAYING}
                >
                  {DrillDifficulty[level]}
                </button>
              ))
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl flex flex-col items-center z-10 mt-8 md:mt-16 mb-20 flex-grow">

        {/* Render different components based on mode */}
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

        {/* Controls */}
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

      {/* Footer */}
      <footer className="fixed bottom-0 w-full p-4 bg-dark-bg/80 backdrop-blur text-slate-600 text-sm flex justify-center gap-6 z-30 border-t border-white/5">
        <span>Press TAB to reset</span>
        <span>Powered by Gemini 3.0</span>
      </footer>

      {/* Result Modal for Practice Mode Only */}
      {status === GameStatus.FINISHED && mode === GameMode.PRACTICE && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f1123] border border-white/10 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-red"></div>

            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />

            <h2 className="text-3xl font-bold text-white mb-2">Session Complete</h2>
            <p className="text-slate-400 mb-8">Great job! Here is how you performed.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-neon-blue font-mono">{stats.wpm}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">WPM</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-3xl font-bold text-neon-green font-mono">{stats.accuracy}%</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Accuracy</div>
              </div>
            </div>

            <button
              onClick={initGame}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* History Modal */}
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