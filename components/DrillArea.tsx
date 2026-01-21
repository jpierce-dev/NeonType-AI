import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { DrillDifficulty, GameStatus, DrillHistoryItem } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { playClickSound } from '../utils/sound';
import { Zap, Target, Crosshair, Timer } from 'lucide-react';

interface DrillAreaProps {
  difficulty: DrillDifficulty;
  status: GameStatus;
  soundEnabled: boolean;
  onStart: () => void;
  onFinish: () => void;
  onSessionComplete: (item: DrillHistoryItem) => void;
  timeElapsed: number;
}

const KEYS = {
  [DrillDifficulty.HOME_ROW]: "asdfghjkl",
  [DrillDifficulty.LOWERCASE]: "abcdefghijklmnopqrstuvwxyz",
  [DrillDifficulty.NUMBERS]: "0123456789",
  [DrillDifficulty.ALL]: "abcdefghijklmnopqrstuvwxyz0123456789[];',./"
};

export const DrillArea: React.FC<DrillAreaProps> = memo(({
  difficulty,
  status,
  soundEnabled,
  onStart,
  onFinish,
  onSessionComplete,
  timeElapsed
}) => {
  const [targetKey, setTargetKey] = useState<string>("");
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [combo, setCombo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef(0);

  // Track time for history (since props reset on finish)
  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timeRef.current = timeElapsed;
    }
  }, [timeElapsed, status]);

  // Generate a random key based on difficulty
  const nextKey = useCallback(() => {
    const chars = KEYS[difficulty];
    setTargetKey(prevKey => {
      let randomChar = chars[Math.floor(Math.random() * chars.length)];
      while (randomChar === prevKey && chars.length > 1) {
        randomChar = chars[Math.floor(Math.random() * chars.length)];
      }
      return randomChar;
    });
  }, [difficulty]);

  // Start/Reset Logic
  useEffect(() => {
    if (status === GameStatus.IDLE) {
      // Save history if we have a real session
      if (score > 0 || total > 0) {
        const newItem: DrillHistoryItem = {
          timestamp: Date.now(),
          difficulty,
          score,
          accuracy: total > 0 ? Math.round((score / total) * 100) : 0,
          duration: timeRef.current,
          cpm: timeRef.current > 0 ? Math.round((score / timeRef.current) * 60) : 0
        };
        onSessionComplete(newItem);
      }

      setScore(0);
      setTotal(0);
      setCombo(0);
      timeRef.current = 0;
      nextKey();
    }
  }, [status, difficulty, nextKey, score, total, onSessionComplete]);

  // Focus management
  useEffect(() => {
    if (status !== GameStatus.FINISHED) {
      inputRef.current?.focus();
    }
  }, [status, targetKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (status === GameStatus.FINISHED) return;

    // Start game on first key press if idle
    if (status === GameStatus.IDLE) {
      onStart();
    }

    const key = e.key;
    // Ignore modifier and control keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(key)) return;

    if (soundEnabled) {
      playClickSound();
    }

    setPressedKey(key);

    // Clear visual press feedback quickly
    setTimeout(() => setPressedKey(null), 150);

    setTotal(prev => prev + 1);

    if (key.toLowerCase() === targetKey.toLowerCase()) {
      // Correct
      setScore(prev => prev + 1);
      setCombo(prev => prev + 1);
      nextKey();
    } else {
      // Incorrect
      setCombo(0);
    }
  };

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 100;
  const cpm = timeElapsed > 0 ? Math.round((score / timeElapsed) * 60) : 0;

  return (
    <div className="w-full flex flex-col items-center gap-8" onClick={() => inputRef.current?.focus()}>
      {/* Hidden input to capture keystrokes globally */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0"
        onKeyDown={handleKeyDown}
        autoFocus
        onBlur={(e) => {
          // Keep focus if playing
          if (status === GameStatus.PLAYING) e.target.focus();
        }}
      />

      {/* Drill HUD */}
      <div className="flex gap-8 md:gap-16">
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-3 h-3 text-neon-blue" /> CPM</span>
          <span className="text-2xl font-mono text-white font-bold">{cpm}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-1"><Crosshair className="w-3 h-3 text-neon-purple" /> Score</span>
          <span className="text-2xl font-mono text-white font-bold">{score}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Combo</span>
          <span className={`text-2xl font-mono font-bold ${combo > 5 ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>{combo}x</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-1"><Timer className="w-3 h-3 text-neon-blue" /> Time</span>
          <span className="text-2xl font-mono text-white font-bold">{timeElapsed}s</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-1"><Target className="w-3 h-3 text-neon-green" /> Accuracy</span>
          <span className="text-2xl font-mono text-white font-bold">{accuracy}%</span>
        </div>
      </div>

      {/* Main Target Display */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-neon-blue/10 rounded-full blur-xl animate-pulse-slow"></div>
        <div className={`
            relative z-10 w-32 h-32 flex items-center justify-center 
            bg-dark-surface border-2 rounded-3xl text-6xl font-mono font-bold text-white shadow-2xl
            transition-all duration-100
            ${status === GameStatus.IDLE ? 'border-white/20' : 'border-neon-blue shadow-[0_0_30px_rgba(0,243,255,0.3)]'}
         `}>
          {status === GameStatus.IDLE ? (
            <span className="text-sm text-center text-slate-500 px-4">Press any key</span>
          ) : (
            targetKey === ' ' ? '␣' : targetKey
          )}
        </div>
      </div>

      {/* Virtual Keyboard */}
      <div className="w-full">
        <VirtualKeyboard activeKey={targetKey} pressedKey={pressedKey} />
      </div>
    </div>
  );
});