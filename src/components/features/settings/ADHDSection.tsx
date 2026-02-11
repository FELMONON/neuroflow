'use client';

import { Card } from '@/components/ui';
import clsx from 'clsx';

const SUBTYPES = ['Inattentive', 'Hyperactive', 'Combined', 'Not sure'] as const;

interface ADHDSectionProps {
  subtype: string;
  peakStart: string;
  peakEnd: string;
  dipStart: string;
  dipEnd: string;
  workDuration: number;
  breakDuration: number;
  onSubtypeChange: (v: string) => void;
  onPeakStartChange: (v: string) => void;
  onPeakEndChange: (v: string) => void;
  onDipStartChange: (v: string) => void;
  onDipEndChange: (v: string) => void;
  onWorkDurationChange: (v: number) => void;
  onBreakDurationChange: (v: number) => void;
}

export function ADHDSection({
  subtype, peakStart, peakEnd, dipStart, dipEnd, workDuration, breakDuration,
  onSubtypeChange, onPeakStartChange, onPeakEndChange, onDipStartChange, onDipEndChange,
  onWorkDurationChange, onBreakDurationChange,
}: ADHDSectionProps) {
  const timeInputClass = 'bg-bg-tertiary border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-flow/40 focus:border-accent-flow/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50';

  return (
    <Card header={<h2 className="text-sm font-semibold text-text-primary">ADHD</h2>}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-text-secondary block mb-2">Subtype</label>
          <div className="flex gap-2 flex-wrap">
            {SUBTYPES.map((s) => (
              <button
                key={s}
                onClick={() => onSubtypeChange(s)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  subtype === s
                    ? 'bg-accent-flow/10 text-accent-flow'
                    : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted">Peak hours</span>
            <div className="flex items-center gap-2">
              <input type="time" value={peakStart} onChange={(e) => onPeakStartChange(e.target.value)} className={timeInputClass} />
              <span className="text-text-muted text-xs">to</span>
              <input type="time" value={peakEnd} onChange={(e) => onPeakEndChange(e.target.value)} className={timeInputClass} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted">Dip hours</span>
            <div className="flex items-center gap-2">
              <input type="time" value={dipStart} onChange={(e) => onDipStartChange(e.target.value)} className={timeInputClass} />
              <span className="text-text-muted text-xs">to</span>
              <input type="time" value={dipEnd} onChange={(e) => onDipEndChange(e.target.value)} className={timeInputClass} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">Work duration</span>
            <span className="text-sm text-text-muted font-mono tabular-nums">{workDuration} min</span>
          </div>
          <input type="range" min={10} max={90} step={5} value={workDuration} onChange={(e) => onWorkDurationChange(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.10] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-flow [&::-webkit-slider-thumb]:cursor-pointer" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">Break duration</span>
            <span className="text-sm text-text-muted font-mono tabular-nums">{breakDuration} min</span>
          </div>
          <input type="range" min={5} max={30} step={5} value={breakDuration} onChange={(e) => onBreakDurationChange(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.10] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-flow [&::-webkit-slider-thumb]:cursor-pointer" />
        </div>
      </div>
    </Card>
  );
}
