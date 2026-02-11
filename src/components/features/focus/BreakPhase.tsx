'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Coffee } from 'lucide-react';
import { Button } from '@/components/ui';

interface BreakPhaseProps {
  sessionMinutes: number;
  onTakeBreak: () => void;
  onSkip: () => void;
}

export function BreakPhase({ sessionMinutes, onTakeBreak, onSkip }: BreakPhaseProps) {
  const [breakRemaining, setBreakRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBreaking = breakRemaining !== null;

  const startBreak = useCallback(() => {
    setBreakRemaining(5 * 60);
    onTakeBreak();
  }, [onTakeBreak]);

  useEffect(() => {
    if (breakRemaining !== null && breakRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setBreakRemaining((prev) => {
          if (prev === null || prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isBreaking]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatBreakTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isBreaking && breakRemaining === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 flex flex-col items-center gap-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-text-primary">Break&apos;s over</h2>
          <p className="mt-1 text-sm text-text-muted">Feeling refreshed? Let&apos;s review your session.</p>
        </motion.div>
        <Button size="lg" onClick={onSkip}>Continue to review</Button>
      </div>
    );
  }

  if (isBreaking && breakRemaining !== null) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 flex flex-col items-center gap-6 text-center">
        <Coffee size={32} className="text-accent-grow" />
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Taking a break</h2>
          <p className="text-sm text-text-muted mt-1">Step away from the screen. Stretch. Breathe.</p>
        </div>
        <span className="font-mono text-3xl tabular-nums text-text-primary">
          {formatBreakTime(breakRemaining)}
        </span>
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip to review</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4 flex flex-col items-center gap-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="space-y-2"
      >
        <h2 className="text-xl font-semibold text-text-primary">
          {sessionMinutes} minutes — done.
        </h2>
        <p className="text-sm text-text-muted">
          Your brain earned a break. Taking one makes the next session better.
        </p>
      </motion.div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" className="w-full" icon={<Coffee size={16} />} onClick={startBreak}>
          Take a 5 min break
        </Button>
        <Button variant="ghost" size="md" className="w-full" onClick={onSkip}>
          Skip to review
        </Button>
      </div>
    </div>
  );
}
