'use client';

import clsx from 'clsx';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-text-primary">{label}</span>
      <div
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors duration-150 shrink-0',
          checked ? 'bg-accent-flow' : 'bg-white/[0.10]',
        )}
        onClick={() => onChange(!checked)}
      >
        <div
          className={clsx(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left] duration-150',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </div>
    </label>
  );
}
