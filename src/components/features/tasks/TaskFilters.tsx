'use client';

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
  return (
    <div className="flex gap-1" role="tablist" aria-label="Task filters">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={activeTab === tab.value}
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
