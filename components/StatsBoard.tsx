import React, { memo } from 'react';
import { GameStats } from '../types';
import { Timer, Zap, Target, AlertCircle, LucideIcon } from 'lucide-react';

interface StatsBoardProps {
  stats: GameStats;
}

export const StatsBoard: React.FC<StatsBoardProps> = memo(({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mb-8">
      <StatCard
        Icon={Timer}
        iconColor="text-neon-blue"
        label="Time"
        value={`${stats.timeElapsed}s`}
        color="border-neon-blue/30"
      />
      <StatCard
        Icon={Zap}
        iconColor="text-neon-purple"
        label="WPM"
        value={stats.wpm}
        color="border-neon-purple/30"
      />
      <StatCard
        Icon={Target}
        iconColor="text-neon-green"
        label="Accuracy"
        value={`${stats.accuracy}%`}
        color="border-neon-green/30"
      />
      <StatCard
        Icon={AlertCircle}
        iconColor="text-neon-red"
        label="Errors"
        value={stats.errors}
        color="border-neon-red/30"
      />
    </div>
  );
});

interface StatCardProps {
  Icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = memo(({ Icon, iconColor, label, value, color }) => (
  <div className={`bg-dark-surface/50 backdrop-blur-md border ${color} rounded-xl p-4 flex flex-col items-center justify-center transition-all hover:bg-dark-surface/80`}>
    <div className="flex items-center gap-2 mb-2 text-slate-400 text-sm font-medium uppercase tracking-wider">
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span>{label}</span>
    </div>
    <div className="text-3xl font-mono font-bold text-white">
      {value}
    </div>
  </div>
));