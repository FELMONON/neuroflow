'use client';

import { Clock } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { TimeBlockRow } from './TimeBlockRow';
import type { PlanTimeBlock } from '@/stores/useDailyPlanStore';
import type { EnergyLevel } from '@/types/database';

const LONG_BLOCK_THRESHOLD = 60;
const BUFFER_DURATION = 10;

interface EnergyPattern {
  peak_start: string;
  peak_end: string;
  dip_start: string;
  dip_end: string;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
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

function getEnergyRank(energy: EnergyLevel): number {
  return { high: 3, medium: 2, low: 1, recharge: 0 }[energy];
}

function isSignificantMismatch(a: EnergyLevel, b: EnergyLevel): boolean {
  return Math.abs(getEnergyRank(a) - getEnergyRank(b)) >= 2;
}

interface TimeBlockListProps {
  blocks: PlanTimeBlock[];
  energyPattern: EnergyPattern;
  isToday: boolean;
  currentMinutes: number | null;
  onStartFocus: (block?: PlanTimeBlock) => void;
}

export function TimeBlockList({ blocks, energyPattern, isToday, currentMinutes, onStartFocus }: TimeBlockListProps) {
  function isCurrentBlock(block: PlanTimeBlock): boolean {
    if (!isToday || currentMinutes === null) return false;
    return currentMinutes >= timeToMinutes(block.start) && currentMinutes < timeToMinutes(block.end);
  }

  return (
    <Card header={<div className="flex items-center gap-2"><Clock size={14} className="text-text-muted" /><span className="text-sm font-medium text-text-secondary">Time blocks</span></div>} noPadding>
      {blocks.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={<Clock />} title="No time blocks yet" description="Structure your day with time blocks matched to your energy." />
        </div>
      ) : (
        <div>
          {blocks.map((block, i) => {
            const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
            const isCurrent = isCurrentBlock(block);
            const energySuggestion = !block.isBreak ? getEnergyForHour(timeToMinutes(block.start) / 60, energyPattern) : null;
            const isAligned = energySuggestion === block.energy;
            const significant = energySuggestion !== null && !isAligned && isSignificantMismatch(block.energy, energySuggestion);
            const isLong = !block.isBreak && duration > LONG_BLOCK_THRESHOLD;
            const breakTime = isLong ? minutesToTime(timeToMinutes(block.start) + Math.round(duration / 2)) : null;
            const prev = i > 0 ? blocks[i - 1] : null;
            const missingBuffer = prev !== null && !prev.isBreak && !block.isBreak &&
              timeToMinutes(block.start) - timeToMinutes(prev.end) < BUFFER_DURATION;
            const padY = block.isBreak ? Math.min(12, Math.max(6, duration * 0.25)) : Math.min(32, Math.max(12, duration * 0.3));

            return (
              <TimeBlockRow
                key={block.id} block={block} isCurrent={isCurrent} duration={duration} padY={padY}
                energySuggestion={energySuggestion} significantMismatch={significant}
                isAligned={isAligned} isLongBlock={isLong} breakSuggestionTime={breakTime}
                missingBuffer={missingBuffer} onStartFocus={onStartFocus}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}
