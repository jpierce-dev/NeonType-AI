import React, { memo, useState, useMemo } from 'react';
import { X, Trophy, Target, Clock, Calendar, TrendingUp, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { DrillHistoryItem, PracticeHistoryItem, GameMode, KeyAnalytics } from '../types';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: GameMode;
    drillHistory: DrillHistoryItem[];
    practiceHistory: PracticeHistoryItem[];
}

// --- Dynamic Trend Chart (SVG) ---

const TrendChart: React.FC<{ data: number[], color: string, label: string }> = ({ data, color, label }) => {
    const safeData = useMemo(() => Array.isArray(data) ? data.filter(v => typeof v === 'number' && !isNaN(v)) : [], [data]);
    if (safeData.length < 2) return null;

    const max = Math.max(...safeData, 1);
    const min = Math.min(...safeData);
    const range = max - min || 1;
    const padding = 20;
    const width = 500;
    const height = 100;

    const getCoords = (i: number, val: number) => {
        const x = (i / (safeData.length - 1)) * (width - padding * 2) + padding;
        const y = height - ((val - min) / range) * (height - padding * 2) - padding;
        return { x, y };
    };

    const points = safeData.map((val, i) => getCoords(i, val));

    // Smooth path logic (Cubic Bezier)
    const renderPath = () => {
        if (points.length < 2) return '';
        let d = `M ${points[0].x},${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            // Simple control points (horizontal smoothing)
            const cx1 = curr.x + (next.x - curr.x) / 2;
            const cy1 = curr.y;
            const cx2 = curr.x + (next.x - curr.x) / 2;
            const cy2 = next.y;
            d += ` C ${cx1},${cy1} ${cx2},${cy2} ${next.x},${next.y}`;
        }
        return d;
    };

    const pathData = renderPath();

    return (
        <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label} Trend</span>
                <span className="text-xs font-mono font-bold" style={{ color }}>{safeData[safeData.length - 1]}</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16 overflow-visible">
                <defs>
                    <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path
                    d={`${pathData} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`}
                    fill={`url(#grad-${label})`}
                />
                <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]"
                />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" />
                ))}
            </svg>
        </div>
    );
};

// --- Heatmap Sub-component ---

const KeyHeatmap: React.FC<{ analytics: KeyAnalytics }> = ({ analytics }) => {
    const rows = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ];

    const getHeatColor = (avgLatency: number, errorRate: number) => {
        if (errorRate > 0.3) return 'bg-red-500/40 text-red-200 border-red-500/50';
        if (avgLatency > 400) return 'bg-yellow-500/30 text-yellow-200 border-yellow-500/50';
        return 'bg-neon-blue/10 text-neon-blue border-neon-blue/20';
    };

    return (
        <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                <AlertCircle className="w-3 h-3" />
                <span>Heatmap: Red = High Error, Yellow = Slow, Blue = Optimal</span>
            </div>
            <div className="space-y-1">
                {rows.map((row, i) => (
                    <div key={i} className="flex justify-center gap-1">
                        {row.map(char => {
                            const data = analytics[char];
                            const errorRate = data && data.total > 0 ? data.errors / data.total : 0;
                            const latency = data ? data.avgLatency : 0;
                            return (
                                <div
                                    key={char}
                                    title={data ? `${char.toUpperCase()}: ${Math.round(latency)}ms, err: ${Math.round(errorRate * 100)}%` : `No data for ${char}`}
                                    className={`
                                        w-8 h-8 flex flex-col items-center justify-center rounded border text-[10px] font-mono
                                        ${data ? getHeatColor(latency, errorRate) : 'border-white/5 text-slate-700'}
                                    `}
                                >
                                    <span className="font-bold">{char.toUpperCase()}</span>
                                    {data && <span className="text-[8px] opacity-70">{Math.round(latency)}</span>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const HistoryModal: React.FC<HistoryModalProps> = memo(({
    isOpen,
    onClose,
    mode,
    drillHistory,
    practiceHistory
}) => {
    const [expandedItem, setExpandedItem] = useState<number | null>(null);

    const isDrill = mode === GameMode.DRILL;
    const rawHistory = isDrill ? drillHistory : practiceHistory;
    const history = useMemo(() =>
        (Array.isArray(rawHistory) ? rawHistory : []).filter(item => item && typeof item === 'object'),
        [rawHistory]
    );

    // Trend Data with safety
    const wpmData = useMemo(() =>
        (Array.isArray(practiceHistory) ? practiceHistory : [])
            .filter(h => h && typeof h === 'object' && typeof h.wpm === 'number')
            .map(h => h.wpm as number)
            .reverse(),
        [practiceHistory]
    );

    const scoreData = useMemo(() =>
        (Array.isArray(drillHistory) ? drillHistory : [])
            .filter(h => h && typeof h === 'object' && typeof (h as DrillHistoryItem).score === 'number')
            .map(h => (h as DrillHistoryItem).score as number)
            .reverse(),
        [drillHistory]
    );

    const cpmData = useMemo(() =>
        (Array.isArray(drillHistory) ? drillHistory : [])
            .filter(h => h && typeof h === 'object' && typeof (h as DrillHistoryItem).cpm === 'number')
            .map(h => (h as DrillHistoryItem).cpm as number)
            .reverse(),
        [drillHistory]
    );

    const accData = useMemo(() =>
        history
            .filter(h => h && typeof h === 'object' && typeof h.accuracy === 'number')
            .map(h => h.accuracy as number)
            .reverse(),
        [history]
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-surface border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-neon-blue/20 rounded-lg">
                            <Calendar className="w-5 h-5 text-neon-blue" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">
                                {isDrill ? 'Drill Analytics' : 'Practice Insights'}
                            </h2>
                            <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Performance History</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 scrollbar-hide">
                    {history.length === 0 ? (
                        <div className="text-center py-24 text-slate-500">
                            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No history recorded yet.</p>
                            <p className="text-sm mt-2 opacity-60">Complete a session to see your stats here.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Trends Summary */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <TrendChart
                                    data={isDrill ? cpmData : wpmData}
                                    color={isDrill ? "#BC13FE" : "#3B82F6"}
                                    label={isDrill ? "CPM" : "WPM"}
                                />
                                {isDrill && scoreData.length > 0 && (
                                    <TrendChart data={scoreData} color="#FACC15" label="Score" />
                                )}
                                <TrendChart data={accData} color="#22c55e" label="Accuracy" />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Recent Sessions</h3>
                                {history.map((item) => (
                                    <div
                                        key={item.timestamp}
                                        className={`
                                            bg-white/5 border rounded-2xl overflow-hidden transition-all duration-300
                                            ${expandedItem === item.timestamp ? 'border-neon-blue/50 ring-1 ring-neon-blue/20' : 'border-white/5'}
                                        `}
                                    >
                                        <div
                                            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5"
                                            onClick={() => setExpandedItem(expandedItem === item.timestamp ? null : item.timestamp)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-xs font-mono bg-dark-bg px-2 py-1 rounded border border-white/5">
                                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                                                    <span className="text-sm font-bold text-white">{item.difficulty}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                {item && 'wpm' in item ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">WPM</span>
                                                        <span className="text-xl font-mono font-bold text-neon-blue">{(item as PracticeHistoryItem).wpm}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">CPM / Score</span>
                                                        <span className="text-xl font-mono font-bold text-white">
                                                            {(item as DrillHistoryItem).cpm ?? '0'} <span className="text-xs text-slate-500 font-normal">/ {(item as DrillHistoryItem).score}</span>
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Accuracy</span>
                                                    <span className="text-xl font-mono font-bold text-neon-green">{item.accuracy}%</span>
                                                </div>

                                                <div className="flex items-center ml-2 text-slate-500">
                                                    {expandedItem === item.timestamp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>

                                        {expandedItem === item.timestamp && item && 'analytics' in item && item.analytics && (
                                            <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-black/20">
                                                <KeyHeatmap analytics={item.analytics} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
