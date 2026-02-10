'use client';

import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EnergyIndicator } from '@/components/ui/EnergyIndicator';
import type { EnergyLevel } from '@/types/database';

interface FocusTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  energyRequired: EnergyLevel;
}

interface TodayFocusProps {
  task: FocusTask;
  onStartSession: () => void;
}

export function TodayFocus({ task, onStartSession }: TodayFocusProps) {
  return (
    <Card className="bg-accent-flow/[0.04] border-accent-flow/20">
      <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
        Focus
      </p>
      <h2 className="text-lg font-medium text-text-primary mb-3">
        {task.title}
      </h2>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-text-secondary text-sm">
          <Clock size={14} className="text-text-muted" />
          <span className="font-mono tabular-nums">{task.estimatedMinutes} min</span>
        </div>
        <EnergyIndicator level={task.energyRequired} />
      </div>
      <Button onClick={onStartSession} className="px-5 shadow-lg">Start</Button>
    </Card>
  );
}
