import React, { memo } from 'react';
import { Trophy } from 'lucide-react';
import { GameStats } from '../types';

export interface FinishModalProps {
    stats: GameStats;
    onPlayAgain: () => void;
}

export const FinishModal: React.FC<FinishModalProps> = memo(({ stats, onPlayAgain }) => (
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
                onClick={onPlayAgain}
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
                Play Again
            </button>
        </div>
    </div>
));
