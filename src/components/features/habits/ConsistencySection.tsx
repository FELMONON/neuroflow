'use client';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { HabitGrid } from '@/components/features/habits/HabitGrid';

function generateGridData(completions: { completed_date: string }[]) {
  const completionDates = new Set(completions.map((c) => c.completed_date));
  const days: { date: string; done: boolean }[] = [];
  const today = new Date();
  for (let week = 3; week >= 0; week--) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (week * 7 + (6 - day)));
      const dateStr = d.toISOString().split('T')[0];
      const isInFuture = d > today;
      days.push({ date: dateStr, done: isInFuture ? false : completionDates.has(dateStr) });
    }
  }
  return days;
}

interface ConsistencySectionProps {
  completions: { completed_date: string }[];
}

export function ConsistencySection({ completions }: ConsistencySectionProps) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const gridData = useMemo(() => generateGridData(completions), [completions]);

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors cursor-pointer mb-3"
      >
        <span>Consistency</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Last 4 weeks</h3>
            <HabitGrid data={gridData} />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
