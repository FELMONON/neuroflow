'use client';

import { Coffee, Play, AlertCircle } from 'lucide-react';
import type { PlanTimeBlock } from '@/stores/useDailyPlanStore';
import type { EnergyLevel } from '@/types/database';
import clsx from 'clsx';

const ENERGY_BORDER: Record<EnergyLevel, string> = {
  high: 'border-l-energy-high', medium: 'border-l-energy-medium',
  low: 'border-l-energy-low', recharge: 'border-l-energy-recharge',
};
const ENERGY_DOT: Record<EnergyLevel, string> = {
  high: 'bg-energy-high', medium: 'bg-energy-medium',
  low: 'bg-energy-low', recharge: 'bg-energy-recharge',
};
const ENERGY_LABEL: Record<EnergyLevel, string> = {
  high: 'High', medium: 'Medium', low: 'Low', recharge: 'Recharge',
};
const ENERGY_TEXT: Record<EnergyLevel, string> = {
  high: 'text-energy-high', medium: 'text-energy-medium',
  low: 'text-energy-low', recharge: 'text-energy-recharge',
};

interface TimeBlockRowProps {
  block: PlanTimeBlock;
  isCurrent: boolean;
  duration: number;
  padY: number;
  energySuggestion: EnergyLevel | null;
  significantMismatch: boolean;
  isAligned: boolean;
  isLongBlock: boolean;
  breakSuggestionTime: string | null;
  missingBuffer: boolean;
  onStartFocus: (block?: PlanTimeBlock) => void;
}

export function TimeBlockRow({
  block, isCurrent, duration, padY, energySuggestion, significantMismatch,
  isAligned, isLongBlock, breakSuggestionTime, missingBuffer, onStartFocus,
}: TimeBlockRowProps) {
  return (
    <div
      style={{
        paddingTop: padY, paddingBottom: padY,
        ...(isCurrent && !block.isBreak ? { boxShadow: 'inset 0 0 24px rgba(124, 106, 255, 0.06)' } : {}),
      }}
      className={clsx(
        'flex items-center gap-3 px-5 border-l-3 group relative transition-all duration-200',
        'border-b border-b-white/[0.04]', 'last:border-b-0',
        block.isBreak ? 'border-l-white/[0.08] bg-white/[0.015]' : ENERGY_BORDER[block.energy],
        isCurrent && !block.isBreak && 'bg-accent-flow/[0.08]',
        isCurrent && block.isBreak && 'bg-white/[0.03]',
        !block.isBreak && 'hover:bg-white/[0.03] cursor-pointer',
        significantMismatch && 'ring-1 ring-accent-sun/20',
      )}
      onClick={!block.isBreak ? () => onStartFocus(block) : undefined}
      role={!block.isBreak ? 'button' : undefined}
      tabIndex={!block.isBreak ? 0 : undefined}
      onKeyDown={!block.isBreak ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStartFocus(block); }
      } : undefined}
    >
      {isCurrent && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2.5 h-2.5 rounded-full bg-accent-flow border-2 border-bg-secondary z-10" />
      )}
      <span className={clsx('text-xs font-mono tabular-nums w-12 shrink-0', isCurrent ? 'text-text-primary font-medium' : 'text-text-muted')}>
        {block.start}
      </span>
      {block.isBreak && <Coffee size={13} className="text-white/[0.2] shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className={clsx('text-sm', block.isBreak ? 'text-text-muted italic' : 'text-text-primary', isCurrent && !block.isBreak && 'font-medium')}>
          {block.label}
        </span>
        {!block.isBreak ? (
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={clsx('w-1.5 h-1.5 rounded-full', ENERGY_DOT[block.energy])} />
            <span className={clsx('text-xs', ENERGY_TEXT[block.energy])}>{ENERGY_LABEL[block.energy]}</span>
            <span className="text-xs text-text-muted font-mono tabular-nums">{duration}m</span>
            {energySuggestion && !isAligned && (
              significantMismatch ? (
                <span className="text-xs text-accent-sun/80 flex items-center gap-1">
                  <AlertCircle size={10} className="shrink-0" />
                  <span>Mismatch — typically {ENERGY_LABEL[energySuggestion].toLowerCase()} energy here</span>
                </span>
              ) : (
                <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                  (energy typically {ENERGY_LABEL[energySuggestion].toLowerCase()})
                </span>
              )
            )}
          </div>
        ) : (
          <span className="text-[10px] text-white/[0.2] font-mono tabular-nums">{duration}m</span>
        )}
        {isLongBlock && breakSuggestionTime && (
          <p className="flex items-center gap-1 mt-1 text-[10px] text-accent-sun/70">
            <AlertCircle size={10} className="shrink-0" />
            <span>Consider a break around {breakSuggestionTime}</span>
          </p>
        )}
        {missingBuffer && (
          <p className="flex items-center gap-1 mt-1 text-[10px] text-accent-sun/60">
            <AlertCircle size={9} className="shrink-0" />
            <span>No transition buffer — your brain needs a moment between tasks</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <span className={clsx('text-xs font-mono tabular-nums', isCurrent ? 'text-text-secondary' : 'text-text-muted')}>
          {block.end}
        </span>
        {!block.isBreak && isCurrent && (
          <span className="flex items-center gap-1 text-xs font-medium text-accent-flow bg-accent-flow/10 px-2 py-1 rounded-md">
            <Play size={11} fill="currentColor" /><span>Focus</span>
          </span>
        )}
        {!block.isBreak && !isCurrent && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-accent-flow">
            <Play size={12} fill="currentColor" /><span className="hidden sm:inline">Focus</span>
          </span>
        )}
      </div>
      {isCurrent && (
        <span className="absolute top-1.5 right-2 text-[9px] uppercase tracking-wider font-medium text-accent-flow bg-accent-flow/10 px-1.5 py-0.5 rounded">
          Now
        </span>
      )}
    </div>
  );
}
