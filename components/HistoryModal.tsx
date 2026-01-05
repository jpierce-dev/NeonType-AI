import React, { memo } from 'react';
import { X, Trophy, Target, Clock, Calendar } from 'lucide-react';
import { DrillHistoryItem, PracticeHistoryItem, GameMode } from '../types';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: GameMode;
    drillHistory: DrillHistoryItem[];
    practiceHistory: PracticeHistoryItem[];
}

export const HistoryModal: React.FC<HistoryModalProps> = memo(({
    isOpen,
    onClose,
    mode,
    drillHistory,
    practiceHistory
}) => {
    if (!isOpen) return null;

    const isDrill = mode === GameMode.DRILL;
    const history = isDrill ? drillHistory : practiceHistory;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f1123] border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-neon-blue" />
                        {isDrill ? 'Drill History' : 'Practice History'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>No history recorded yet.</p>
                            <p className="text-sm mt-2">Complete a session to see your stats here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((item, index) => (
                                <div
                                    key={item.timestamp}
                                    className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-slate-400 font-mono">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {item.difficulty}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {'wpm' in item ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-slate-500 uppercase tracking-wider">WPM</span>
                                                <span className="text-lg font-mono font-bold text-neon-blue">{item.wpm}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-slate-500 uppercase tracking-wider">Score</span>
                                                <span className="text-lg font-mono font-bold text-white">{(item as DrillHistoryItem).score}</span>
                                            </div>
                                        )}

                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Accuracy</span>
                                            <span className="text-lg font-mono font-bold text-neon-green">{item.accuracy}%</span>
                                        </div>

                                        <div className="flex flex-col items-end min-w-[60px]">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Time</span>
                                            <span className="text-lg font-mono font-bold text-slate-300">{item.duration}s</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
