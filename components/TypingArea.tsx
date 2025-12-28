import React, { useRef, useEffect, useMemo } from 'react';
import { GameStatus } from '../types';

interface TypingAreaProps {
  targetText: string;
  userInput: string;
  status: GameStatus;
  onInputChange: (input: string) => void;
}

export const TypingArea: React.FC<TypingAreaProps> = ({ targetText, userInput, status, onInputChange }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

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
    if (cursorRef.current && containerRef.current) {
      const cursorTop = cursorRef.current.offsetTop;
      const containerHeight = containerRef.current.clientHeight;
      const scrollTop = containerRef.current.scrollTop;
      
      // Scroll if cursor is near bottom
      if (cursorTop > scrollTop + containerHeight - 60) {
        containerRef.current.scrollTo({
          top: cursorTop - 40,
          behavior: 'smooth'
        });
      }
    }
  }, [userInput]);

  const renderedText = useMemo(() => {
    return targetText.split('').map((char, index) => {
      let className = "transition-colors duration-75 ";
      let isCurrent = false;

      if (index < userInput.length) {
        if (userInput[index] === char) {
          className += "text-neon-green drop-shadow-[0_0_2px_rgba(10,255,104,0.5)]";
        } else {
          className += "text-neon-red bg-neon-red/10 decoration-neon-red underline decoration-2 underline-offset-4";
        }
      } else if (index === userInput.length) {
        className += "text-white bg-white/10 rounded-sm";
        isCurrent = true;
      } else {
        className += "text-slate-600";
      }

      return (
        <span 
          key={index} 
          ref={isCurrent ? cursorRef : null}
          className={`${className} relative inline-block min-w-[1ch]`}
        >
          {isCurrent && (
            <span className="absolute left-0 -top-1 w-[2px] h-[1.2em] bg-neon-blue animate-cursor-blink shadow-[0_0_8px_#00f3ff]"></span>
          )}
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  }, [targetText, userInput]);

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
          renderedText
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