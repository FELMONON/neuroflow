'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import type { EnergyLevel } from '@/types/database';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface TimeBlockData {
  id: string;
  start: string;
  end: string;
  label: string;
  energy: EnergyLevel;
}

interface TimeBlocksProps {
  blocks: TimeBlockData[];
}

const energyBorderColor: Record<EnergyLevel, string> = {
  high: 'border-l-energy-high',
  medium: 'border-l-energy-medium',
  low: 'border-l-energy-low',
  recharge: 'border-l-energy-recharge',
};

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function TimeBlocks({ blocks }: TimeBlocksProps) {
  const reducedMotion = useReducedMotion();
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    setCurrentMinutes(getCurrentMinutes());
    const interval = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { timelineStart, timelineEnd } = useMemo(() => {
    if (blocks.length === 0) return { timelineStart: 0, timelineEnd: 1440 };
    return {
      timelineStart: parseTime(blocks[0].start),
      timelineEnd: parseTime(blocks[blocks.length - 1].end),
    };
  }, [blocks]);

  const showCurrentLine =
    currentMinutes !== null && currentMinutes >= timelineStart && currentMinutes <= timelineEnd;

  if (blocks.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-text-primary mb-3">Schedule</h3>
        <EmptyState
          icon={<Calendar />}
          title="No time blocks yet"
          description="Plan your day with time blocks to match your energy levels."
          action={{ label: 'Go to Plan', onClick: () => window.location.href = '/app/plan' }}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-text-primary mb-3">Schedule</h3>

      <motion.div
        className="flex flex-col gap-1 relative"
        variants={reducedMotion ? undefined : staggerContainer}
        initial="initial"
        animate="animate"
      >
        {blocks.map((block) => {
          const blockStart = parseTime(block.start);
          const blockEnd = parseTime(block.end);
          const isCurrent = currentMinutes !== null && currentMinutes >= blockStart && currentMinutes < blockEnd;

          return (
            <motion.div
              key={block.id}
              variants={reducedMotion ? undefined : staggerItem}
              className={`flex items-start gap-3 border-l-[3px] px-3 py-2 rounded-r-lg ${
                energyBorderColor[block.energy]
              } ${isCurrent ? 'bg-white/[0.03]' : ''}`}
            >
              <span className="text-xs text-text-muted font-mono w-20 shrink-0 pt-0.5 tabular-nums">
                {formatTimeLabel(block.start)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">{block.label}</p>
                <p className="text-xs text-text-muted font-mono tabular-nums">
                  {formatTimeLabel(block.start)} - {formatTimeLabel(block.end)}
                </p>
              </div>
            </motion.div>
          );
        })}

        {showCurrentLine && (
          <div
            className="absolute left-0 right-0 flex items-center pointer-events-none"
            style={{
              top: `${((currentMinutes! - timelineStart) / (timelineEnd - timelineStart)) * 100}%`,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-accent-flow -ml-[5px] shrink-0" />
            <span className="flex-1 h-[2px] bg-accent-flow" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
