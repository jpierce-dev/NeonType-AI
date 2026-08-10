import React, { memo } from 'react';

export const Footer: React.FC = memo(() => (
    <footer className="w-full mt-auto py-2.5 px-4 bg-dark-bg/80 backdrop-blur text-slate-500 text-xs md:text-sm flex justify-center gap-4 md:gap-6 z-20 border-t border-white/5">
        <span>Press <kbd className="bg-white/10 px-1 rounded text-slate-400">Shift</kbd> + <kbd className="bg-white/10 px-1 rounded text-slate-400">Tab</kbd> to reset</span>
        <span>Powered by Gemini 3.0</span>
    </footer>
));
