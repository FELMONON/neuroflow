'use client';

import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RhythmStepProps {
  peakStart: string;
  peakEnd: string;
  dipStart: string;
  dipEnd: string;
  onPeakChange: (start: string, end: string) => void;
  onDipChange: (start: string, end: string) => void;
  workDuration: number;
  onWorkDurationChange: (minutes: number) => void;
  existingSystems: string[];
  onExistingSystemsChange: (systems: string[]) => void;
  onContinue: () => void;
}

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
  return { value: `${String(i).padStart(2, '0')}:00`, label };
});

const durations = [15, 25, 45, 60, 90];
const systems = ['Calendar', 'To-do app', 'Bullet journal', 'None'];

function toHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a0 = toHour(aStart);
  const a1 = toHour(aEnd);
  const b0 = toHour(bStart);
  const b1 = toHour(bEnd);
  if (a0 >= a1 || b0 >= b1) return false;
  return a0 < b1 && b0 < a1;
}

function TimeRow({
  label,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  hasError,
}: {
  label: string;
  startValue: string;
  endValue: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  hasError?: boolean;
}) {
  const selectClass = `h-10 rounded-xl bg-bg-secondary border text-text-primary text-sm px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary cursor-pointer appearance-none flex-1 ${
    hasError ? 'border-accent-spark/50' : 'border-white/[0.06]'
  }`;
  return (
    <div>
      <p className="text-sm text-text-secondary mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <select value={startValue} onChange={(e) => onStartChange(e.target.value)} className={selectClass}>
          {timeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <span className="text-text-muted text-sm">to</span>
        <select value={endValue} onChange={(e) => onEndChange(e.target.value)} className={selectClass}>
          {timeOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export function RhythmStep({
  peakStart, peakEnd, dipStart, dipEnd,
  onPeakChange, onDipChange,
  workDuration, onWorkDurationChange,
  existingSystems, onExistingSystemsChange,
  onContinue,
}: RhythmStepProps) {
  const toggleSystem = (s: string) => {
    if (existingSystems.includes(s)) {
      onExistingSystemsChange(existingSystems.filter((x) => x !== s));
    } else {
      onExistingSystemsChange([...existingSystems, s]);
    }
  };

  const overlap = useMemo(
    () => rangesOverlap(peakStart, peakEnd, dipStart, dipEnd),
    [peakStart, peakEnd, dipStart, dipEnd],
  );

  return (
    <div className="flex flex-col items-center px-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text-primary text-center">
        When do you feel most focused?
      </h2>

      <div className="w-full mt-8 space-y-4">
        <TimeRow
          label="Peak hours"
          startValue={peakStart} endValue={peakEnd}
          onStartChange={(v) => onPeakChange(v, peakEnd)}
          onEndChange={(v) => onPeakChange(peakStart, v)}
          hasError={overlap}
        />
        <TimeRow
          label="Dip hours"
          startValue={dipStart} endValue={dipEnd}
          onStartChange={(v) => onDipChange(v, dipEnd)}
          onEndChange={(v) => onDipChange(dipStart, v)}
          hasError={overlap}
        />
        {overlap && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-spark/10 border border-accent-spark/20">
            <AlertCircle size={14} className="text-accent-spark shrink-0" />
            <p className="text-xs text-accent-spark">Peak and dip hours overlap. Adjust so they don&apos;t collide.</p>
          </div>
        )}
      </div>

      <div className="w-full mt-8">
        <p className="text-sm text-text-secondary mb-3">Work duration</p>
        <div className="flex gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => onWorkDurationChange(d)}
              aria-pressed={workDuration === d}
              className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                workDuration === d
                  ? 'bg-accent-flow text-white'
                  : 'bg-bg-secondary border border-white/[0.06] text-text-secondary'
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="w-full mt-8">
        <p className="text-sm text-text-secondary mb-3">Existing systems</p>
        <div className="flex flex-wrap gap-2">
          {systems.map((s) => {
            const selected = existingSystems.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSystem(s)}
                aria-pressed={selected}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
                  selected
                    ? 'bg-accent-flow/10 text-accent-flow border-accent-flow/20'
                    : 'bg-white/[0.04] text-text-secondary border-white/[0.06]'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <Button size="lg" disabled={overlap} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export type { RhythmStepProps };
