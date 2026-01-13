import React, { useRef, useEffect, useMemo, memo } from 'react';
import { GameStatus } from '../types';

interface TypingAreaProps {
  targetText: string;
  userInput: string;
  status: GameStatus;
  onInputChange: (input: string) => void;
}

interface CharProps {
  char: string;
  index: number;
  userChar: string | undefined;
  isCurrent: boolean;
}

const Character: React.FC<CharProps> = memo(({ char, userChar, isCurrent }) => {
  let className = "transition-colors duration-75 ";

  if (userChar !== undefined) {
    if (userChar === char) {
      // Removed drop-shadow as it's expensive when applied to many elements
      // Using just bright color for performance
      className += "text-neon-green";
    } else {
      className += "text-neon-red bg-neon-red/10 decoration-neon-red underline decoration-2 underline-offset-4";
    }
  } else if (isCurrent) {
    className += "text-white bg-white/10 rounded-sm";
  } else {
    className += "text-slate-600";
  }

  return (
    <span className={`${className} relative inline-block min-w-[1ch]`}>
      {isCurrent && (
        <span className="absolute left-0 -top-1 w-[2px] h-[1.2em] bg-neon-blue animate-cursor-blink shadow-[0_0_8px_#00f3ff]"></span>
      )}
      {char === ' ' ? '\u00A0' : char}
    </span>
  );
});

export const TypingArea: React.FC<TypingAreaProps> = ({ targetText, userInput, status, onInputChange }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically when playing
  useEffect(() => {
    if (status === GameStatus.PLAYING && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Handle keeping focus on click
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (containerRef.current) {
      // Direct access to children is much faster than querySelector
      const currentIndex = userInput.length;
      const cursorElement = containerRef.current.children[currentIndex] as HTMLElement;

      if (cursorElement) {
        const cursorTop = cursorElement.offsetTop;
        const containerHeight = containerRef.current.clientHeight;
        const scrollTop = containerRef.current.scrollTop;

        if (cursorTop > scrollTop + containerHeight - 80) {
          containerRef.current.scrollTo({
            top: cursorTop - 60,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [userInput.length]); // Only depend on length change

  const characters = useMemo(() => targetText.split(''), [targetText]);

  return (
    <div
      className="relative w-full max-w-4xl min-h-[200px] bg-dark-surface/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8 cursor-text overflow-hidden group hover:border-white/10 transition-colors"
      onClick={handleContainerClick}
    >
      {/* Hidden Input for handling typing logic specifically */}
      <textarea
        ref={inputRef}
        value={userInput}
        onChange={(e) => onInputChange(e.target.value)}
        className="absolute opacity-0 top-0 left-0 w-full h-full cursor-default -z-10"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        disabled={status === GameStatus.FINISHED || status === GameStatus.LOADING}
      />

      {/* Visual Text Display */}
      <div
        ref={containerRef}
        className="font-mono text-2xl md:text-3xl leading-relaxed break-words outline-none max-h-[300px] overflow-y-auto pr-4 scrollbar-hide"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {status === GameStatus.LOADING ? (
          <div className="flex items-center justify-center h-40 space-x-2">
            <div className="w-3 h-3 bg-neon-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-neon-purple rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-neon-green rounded-full animate-bounce"></div>
          </div>
        ) : (
          characters.map((char, index) => (
            <Character
              key={index}
              char={char}
              index={index}
              userChar={userInput[index]}
              isCurrent={index === userInput.length}
            />
          ))
        )}
      </div>

      {status === GameStatus.IDLE && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-2xl">
          <p className="text-white/70 font-mono animate-pulse">Click or Press any key to start</p>
        </div>
      )}
    </div>
  );
};