import React, { memo, useMemo } from 'react';

interface VirtualKeyboardProps {
  activeKey: string;
  pressedKey: string | null;
}

interface KeyProps {
  keyObj: { key: string, w: number, label?: string };
  isActive: boolean;
  isPressed: boolean;
}

const Key: React.FC<KeyProps> = memo(({ keyObj, isActive, isPressed }) => {
  let baseStyle = "h-12 md:h-16 lg:h-20 m-0.5 md:m-1 rounded-lg flex items-center justify-center text-sm md:text-lg lg:text-xl font-mono transition-all duration-75 border border-white/10 ";

  if (isActive) {
    baseStyle += "bg-neon-blue text-black shadow-[0_0_25px_#00f3ff] scale-95 font-bold border-neon-blue z-10";
  } else if (isPressed) {
    baseStyle += "bg-white/20 text-white scale-90 border-white/50";
  } else {
    baseStyle += "bg-dark-surface/80 text-slate-400 hover:bg-white/5";
  }

  return (
    <div
      className={baseStyle}
      style={{
        width: `${keyObj.w * 3.5}rem`,
        flexGrow: keyObj.w,
        flexShrink: 1,
        minWidth: '0'
      }}
    >
      {keyObj.label !== undefined ? keyObj.label : keyObj.key.toUpperCase()}
    </div>
  );
});

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = memo(({ activeKey, pressedKey }) => {
  const rows = useMemo(() => [
    [
      { key: '`', w: 1 }, { key: '1', w: 1 }, { key: '2', w: 1 }, { key: '3', w: 1 }, { key: '4', w: 1 }, { key: '5', w: 1 }, { key: '6', w: 1 }, { key: '7', w: 1 }, { key: '8', w: 1 }, { key: '9', w: 1 }, { key: '0', w: 1 }, { key: '-', w: 1 }, { key: '=', w: 1 }, { key: 'Backspace', w: 2, label: '⌫' }
    ],
    [
      { key: 'Tab', w: 1.5, label: 'Tab' }, { key: 'q', w: 1 }, { key: 'w', w: 1 }, { key: 'e', w: 1 }, { key: 'r', w: 1 }, { key: 't', w: 1 }, { key: 'y', w: 1 }, { key: 'u', w: 1 }, { key: 'i', w: 1 }, { key: 'o', w: 1 }, { key: 'p', w: 1 }, { key: '[', w: 1 }, { key: ']', w: 1 }, { key: '\\', w: 1.5 }
    ],
    [
      { key: 'CapsLock', w: 1.8, label: 'Caps' }, { key: 'a', w: 1 }, { key: 's', w: 1 }, { key: 'd', w: 1 }, { key: 'f', w: 1 }, { key: 'g', w: 1 }, { key: 'h', w: 1 }, { key: 'j', w: 1 }, { key: 'k', w: 1 }, { key: 'l', w: 1 }, { key: ';', w: 1 }, { key: "'", w: 1 }, { key: 'Enter', w: 2.2, label: '↵' }
    ],
    [
      { key: 'Shift', w: 2.4, label: 'Shift' }, { key: 'z', w: 1 }, { key: 'x', w: 1 }, { key: 'c', w: 1 }, { key: 'v', w: 1 }, { key: 'b', w: 1 }, { key: 'n', w: 1 }, { key: 'm', w: 1 }, { key: ',', w: 1 }, { key: '.', w: 1 }, { key: '/', w: 1 }, { key: 'ShiftRight', w: 2.4, label: 'Shift' }
    ],
    [
      { key: 'Space', w: 6, label: '' }
    ]
  ], []);

  const active = activeKey.toLowerCase();
  const pressed = pressedKey?.toLowerCase();

  return (
    <div className="w-full max-w-6xl mx-auto p-2 md:p-6 lg:p-8 bg-dark-bg/50 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm select-none">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center w-full">
          {row.map((keyObj, kIndex) => {
            const k = keyObj.key.toLowerCase();
            const isActive = k === active || (keyObj.label === '' && active === ' ');
            const isPressed = pressed === k || (keyObj.label === '' && pressed === ' ');

            return (
              <Key
                key={kIndex}
                keyObj={keyObj}
                isActive={isActive}
                isPressed={isPressed}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
});