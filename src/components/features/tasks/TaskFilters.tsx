'use client';

import { useCallback, type KeyboardEvent } from 'react';
import clsx from 'clsx';

type FilterTab = 'all' | 'today' | 'inbox' | 'done';

interface TaskFiltersProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
}

const tabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'done', label: 'Done' },
];

export function TaskFilters({ activeTab, onTabChange }: TaskFiltersProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.value === activeTab);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = tabs[(currentIndex + 1) % tabs.length];
        onTabChange(next.value);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
        onTabChange(prev.value);
      }
    },
    [activeTab, onTabChange],
  );

  return (
    <div className="flex gap-1" role="tablist" aria-label="Task filters" onKeyDown={handleKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
          tabIndex={activeTab === tab.value ? 0 : -1}
          onClick={() => onTabChange(tab.value)}
          className={clsx(
            'text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer rounded-lg px-3 py-1',
            'focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none',
            activeTab === tab.value
              ? 'bg-accent-flow/10 text-accent-flow'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { FilterTab };
