'use client';

import { Sun, Battery, Zap } from 'lucide-react';
import { Card } from '@/components/ui';
import type { EnergyLevel } from '@/types/database';
import clsx from 'clsx';

const ENERGY_DOT: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

const ENERGY_LABEL: Record<EnergyLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  recharge: 'Recharge',
};

interface EnergyPattern {
  peak_start: string;
  peak_end: string;
  dip_start: string;
  dip_end: string;
}

function timeStrToHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function getEnergyForHour(hour: number, pattern: EnergyPattern): EnergyLevel {
  const peakStart = timeStrToHour(pattern.peak_start);
  const peakEnd = timeStrToHour(pattern.peak_end);
  const dipStart = timeStrToHour(pattern.dip_start);
  const dipEnd = timeStrToHour(pattern.dip_end);

  if (hour >= peakStart && hour < peakEnd) return 'high';
  if (hour >= dipStart && hour < dipEnd) return 'low';
  if (hour >= 6 && hour < 20) return 'medium';
  return 'recharge';
}

interface EnergyForecastProps {
  energyPattern: EnergyPattern;
  isToday: boolean;
  currentMinutes: number | null;
}

export function EnergyForecast({ energyPattern, isToday, currentMinutes }: EnergyForecastProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-text-muted" />
          <span className="text-sm font-medium text-text-secondary">Your energy pattern today</span>
        </div>
        <div className="flex items-center gap-3">
          {(['high', 'medium', 'low', 'recharge'] as const).map((level) => (
            <span key={level} className="flex items-center gap-1">
              <span className={clsx('w-2 h-2 rounded-full', ENERGY_DOT[level])} />
              <span className="text-[10px] text-text-muted">{ENERGY_LABEL[level]}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-end gap-1">
        {Array.from({ length: 10 }, (_, i) => {
          const hour = 8 + i;
          const energy = getEnergyForHour(hour, energyPattern);
          const isCurrent = isToday && currentMinutes !== null && Math.floor(currentMinutes / 60) === hour;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={clsx(
                  'w-full rounded-sm transition-all duration-200',
                  ENERGY_DOT[energy],
                  energy === 'high' ? 'h-8' : energy === 'medium' ? 'h-5' : energy === 'low' ? 'h-3' : 'h-2',
                  isCurrent && 'ring-2 ring-white/[0.4] ring-offset-1 ring-offset-bg-secondary',
                )}
              />
              <span className={clsx(
                'text-[10px] font-mono tabular-nums',
                isCurrent ? 'text-text-primary font-medium' : 'text-text-muted',
              )}>
                {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'p' : 'a'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <Sun size={12} className="text-energy-high" />
          Peak: {energyPattern.peak_start}{'\u2013'}{energyPattern.peak_end}
        </span>
        <span className="flex items-center gap-1.5">
          <Battery size={12} className="text-energy-low" />
          Dip: {energyPattern.dip_start}{'\u2013'}{energyPattern.dip_end}
        </span>
      </div>
    </Card>
  );
}
