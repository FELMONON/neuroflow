'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';

interface ParkingLotProps {
  items: string[];
  onAdd: (content: string) => void;
  onRemove: (index: number) => void;
}

function ParkingLot({ items, onAdd, onRemove }: ParkingLotProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus back to input after adding an item
  const prevLength = useRef(items.length);
  useEffect(() => {
    if (items.length > prevLength.current) {
      inputRef.current?.focus();
    }
    prevLength.current = items.length;
  }, [items.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={14} className="text-accent-sun" />
        <span className="text-sm font-medium text-text-secondary">Parking Lot</span>
        {items.length > 0 && (
          <span className="text-[10px] font-mono tabular-nums text-white/[0.3]">
            {items.length} saved
          </span>
        )}
      </div>

      {/* Captured thoughts — always visible so user trusts they're saved */}
      {items.length > 0 && (
        <ul className="mb-2 space-y-0.5">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-2 text-sm text-text-secondary py-1.5 px-3 rounded-lg bg-white/[0.02]"
            >
              <span className="w-1 h-1 rounded-full bg-accent-sun/40 shrink-0" />
              <span className="flex-1 truncate">{item}</span>
              <button
                onClick={() => onRemove(i)}
                aria-label={`Remove "${item}"`}
                className="p-1 text-text-muted hover:text-text-primary transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none rounded-lg"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={items.length === 0 ? 'Thought popping up? Park it here...' : 'Another thought...'}
          aria-label="Capture a thought"
          className="w-full h-9 rounded-lg bg-bg-tertiary border border-white/[0.08] text-sm text-text-primary px-3 placeholder:text-text-muted focus:outline-none focus:border-accent-sun/30 focus-visible:ring-2 focus-visible:ring-accent-sun/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        />
      </form>

      {items.length === 0 && (
        <p className="text-[11px] text-white/[0.15] mt-1.5">
          Don&apos;t lose your train of thought — dump it here and come back later.
        </p>
      )}
    </div>
  );
}

export { ParkingLot };
export type { ParkingLotProps };
