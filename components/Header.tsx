import React, { memo } from 'react';
import { Keyboard, Gamepad2, Type, Maximize2, Minimize2, Volume2, VolumeX, History } from 'lucide-react';
import { GameMode, Difficulty, DrillDifficulty, GameStatus } from '../types';

export interface HeaderProps {
    mode: GameMode;
    setMode: (mode: GameMode) => void;
    soundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    isFullScreen: boolean;
    toggleFullScreen: () => void;
    setIsHistoryOpen: (open: boolean) => void;
    difficulty: Difficulty;
    setDifficulty: (difficulty: Difficulty) => void;
    drillDifficulty: DrillDifficulty;
    setDrillDifficulty: (difficulty: DrillDifficulty) => void;
    status: GameStatus;
}

export const Header: React.FC<HeaderProps> = memo(({
    mode, setMode, soundEnabled, setSoundEnabled, isFullScreen, toggleFullScreen, setIsHistoryOpen, difficulty, setDifficulty, drillDifficulty, setDrillDifficulty, status
}) => (
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === GameMode.PRACTICE ? 'bg-neon-blue text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Type className="w-4 h-4" /> Practice
                    </button>
                    <button
                        onClick={() => setMode(GameMode.DRILL)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === GameMode.DRILL ? 'bg-neon-purple text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
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
                            className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-300 ${difficulty === Difficulty[level] ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
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
                            className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-300 ${drillDifficulty === DrillDifficulty[level] ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            disabled={status === GameStatus.PLAYING}
                        >
                            {DrillDifficulty[level]}
                        </button>
                    ))
                )}
            </div>
        </div>
    </header>
));
