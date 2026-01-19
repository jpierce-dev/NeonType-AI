import React, { useRef, useEffect, useMemo, memo, useState, useCallback } from 'react';
import { GameStatus } from '../types';

interface TypingAreaProps {
  targetText: string;
  userInput: string;
  status: GameStatus;
  onInputChange: (input: string) => void;
}

interface CharProps {
  char: string;
  userChar: string | undefined;
  isCurrent: boolean;
}

// Virtualization config
const CHARS_BEFORE_CURSOR = 100; // Characters to render before cursor
const CHARS_AFTER_CURSOR = 150;  // Characters to render after cursor

const Character: React.FC<CharProps> = memo(({ char, userChar, isCurrent }) => {
  let className = "transition-colors duration-75 ";

  if (userChar !== undefined) {
    if (userChar === char) {
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

// Placeholder for virtualized characters (takes no space, just reserves position)
const VirtualizedPlaceholder: React.FC<{ count: number }> = memo(({ count }) => {
  if (count <= 0) return null;
  // We need to maintain the character positions, so render invisible spans
  return (
    <span className="text-transparent select-none" aria-hidden="true">
      {'\u00A0'.repeat(count)}
    </span>
  );
});

export const TypingArea: React.FC<TypingAreaProps> = ({ targetText, userInput, status, onInputChange }) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Focus input automatically when playing
  useEffect(() => {
    if (status === GameStatus.PLAYING && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Handle keeping focus on click
  const handleContainerClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Track scroll for potential future optimizations
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (containerRef.current && status === GameStatus.PLAYING) {
      const container = containerRef.current;
      // Find cursor position - we need to look within the rendered range
      const cursorIndex = userInput.length;
      const startIndex = Math.max(0, cursorIndex - CHARS_BEFORE_CURSOR);
      const adjustedIndex = cursorIndex - startIndex;

      // Get the correct child element (accounting for placeholder + rendered chars)
      const hasPlaceholder = startIndex > 0 ? 1 : 0;
      const cursorElement = container.children[hasPlaceholder + adjustedIndex] as HTMLElement;

      if (cursorElement) {
        const cursorTop = cursorElement.offsetTop;
        const containerHeight = container.clientHeight;
        const currentScroll = container.scrollTop;

        if (cursorTop > currentScroll + containerHeight - 80) {
          container.scrollTo({
            top: cursorTop - 60,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [userInput.length, status]);

  // Virtualized rendering - only render chars around cursor
  const { visibleChars, startIndex, endIndex } = useMemo(() => {
    const cursorPos = userInput.length;
    const totalChars = targetText.length;

    // For short texts, render everything
    if (totalChars <= CHARS_BEFORE_CURSOR + CHARS_AFTER_CURSOR) {
      return {
        visibleChars: targetText.split(''),
        startIndex: 0,
        endIndex: totalChars
      };
    }

    // Calculate visible window
    const start = Math.max(0, cursorPos - CHARS_BEFORE_CURSOR);
    const end = Math.min(totalChars, cursorPos + CHARS_AFTER_CURSOR);

    return {
      visibleChars: targetText.slice(start, end).split(''),
      startIndex: start,
      endIndex: end
    };
  }, [targetText, userInput.length]);

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
        onScroll={handleScroll}
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
          <>
            {/* Placeholder for characters before visible window */}
            <VirtualizedPlaceholder count={startIndex} />

            {/* Visible characters */}
            {visibleChars.map((char, i) => {
              const actualIndex = startIndex + i;
              return (
                <Character
                  key={actualIndex}
                  char={char}
                  userChar={userInput[actualIndex]}
                  isCurrent={actualIndex === userInput.length}
                />
              );
            })}

            {/* Placeholder for characters after visible window */}
            <VirtualizedPlaceholder count={targetText.length - endIndex} />
          </>
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