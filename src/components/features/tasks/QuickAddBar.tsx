'use client';

import { useState, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';

interface QuickAddBarProps {
  onAdd: (title: string) => void;
}

export function QuickAddBar({ onAdd }: QuickAddBarProps) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
    inputRef.current?.focus();
  }, [title, onAdd]);

  return (
    <div className="hidden sm:flex items-center gap-2 mb-6 bg-bg-secondary border border-white/[0.06] rounded-xl px-4 py-2">
      <Plus size={16} className="text-text-muted shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Add a task..."
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
      />
      {title.trim() && (
        <button
          onClick={handleSubmit}
          className="text-xs font-medium text-accent-flow hover:text-accent-flow/80 transition-all duration-200 active:scale-[0.98] cursor-pointer px-2 py-1"
        >
          Add
        </button>
      )}
    </div>
  );
}
