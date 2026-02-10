'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Coffee } from 'lucide-react';
import { Skeleton, Button } from '@/components/ui';
import { useSessionStore } from '@/stores/useSessionStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useGameLoop } from '@/hooks/useGameLoop';
import type { FocusSession } from '@/types/database';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } as const;

function FocusLoadingFallback() {
  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-8">
      <div>
        <Skeleton variant="text" width="180px" />
        <div className="mt-2"><Skeleton variant="text" width="240px" /></div>
      </div>
      <Skeleton variant="text" width="100%" height={40} />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="100%" height={40} />
        ))}
      </div>
      <Skeleton variant="text" width="100%" height={44} />
    </div>
  );
}

const SessionSetup = dynamic(
  () => import('@/components/features/focus/SessionSetup').then((m) => ({ default: m.SessionSetup })),
  { ssr: false, loading: () => <FocusLoadingFallback /> },
);
const ActiveSession = dynamic(
  () => import('@/components/features/focus/ActiveSession').then((m) => ({ default: m.ActiveSession })),
  { ssr: false, loading: () => <FocusLoadingFallback /> },
);
const PostSession = dynamic(
  () => import('@/components/features/focus/PostSession').then((m) => ({ default: m.PostSession })),
  { ssr: false, loading: () => <FocusLoadingFallback /> },
);

type Phase = 'setup' | 'active' | 'break' | 'post';

/** Break prompt — structured transition between focus and rest */
function BreakPhase({ sessionMinutes, onTakeBreak, onSkip }: {
  sessionMinutes: number;
  onTakeBreak: () => void;
  onSkip: () => void;
}) {
  const [breakRemaining, setBreakRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isBreaking = breakRemaining !== null;

  const startBreak = useCallback(() => {
    setBreakRemaining(5 * 60); // 5 minute break
    onTakeBreak();
  }, [onTakeBreak]);

  // Break countdown
  useEffect(() => {
    if (breakRemaining !== null && breakRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setBreakRemaining((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [breakRemaining !== null && breakRemaining > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatBreakTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isBreaking && breakRemaining === 0) {
    // Break is over
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

  if (isBreaking) {
    // Break countdown
    return (
      <div className="max-w-md mx-auto py-16 px-4 flex flex-col items-center gap-6 text-center">
        <Coffee size={32} className="text-accent-grow" />
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Taking a break</h2>
          <p className="text-sm text-text-muted mt-1">Step away from the screen. Stretch. Breathe.</p>
        </div>
        <span className="font-mono text-3xl tabular-nums text-text-primary">
          {formatBreakTime(breakRemaining!)}
        </span>
        <Button variant="ghost" size="sm" onClick={onSkip}>Skip to review</Button>
      </div>
    );
  }

  // Break prompt
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

export default function FocusPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const router = useRouter();
  const startSession = useSessionStore((s) => s.startSession);
  const currentSession = useSessionStore((s) => s.currentSession);
  const setFocusModeActive = useUIStore((s) => s.setFocusModeActive);
  const completeTaskStore = useTaskStore((s) => s.completeTask);
  const { onFocusSessionComplete, onTaskComplete } = useGameLoop();

  const handleStart = useCallback(
    (session: FocusSession) => {
      startSession(session);
      setSessionMinutes(session.planned_duration);
      setPhase('active');
    },
    [startSession],
  );

  const handleComplete = useCallback(() => {
    // Award XP for completing focus session
    if (currentSession) {
      onFocusSessionComplete(currentSession.id);
      // Mark associated task as done if one exists
      if (currentSession.task_id) {
        completeTaskStore(currentSession.task_id);
        onTaskComplete(currentSession.task_id);
      }
    }
    setPhase('break');
  }, [currentSession, onFocusSessionComplete, onTaskComplete, completeTaskStore]);

  const handleBreakToReview = useCallback(() => {
    setFocusModeActive(false);
    setPhase('post');
  }, [setFocusModeActive]);

  const handleStartAnother = useCallback(() => {
    setPhase('setup');
  }, []);

  const handleGoHome = useCallback(() => {
    router.push('/app/today');
  }, [router]);

  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 min-h-screen bg-bg-primary"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {phase === 'setup' && <SessionSetup onStart={handleStart} />}
      {phase === 'active' && <ActiveSession onComplete={handleComplete} />}
      {phase === 'break' && (
        <BreakPhase
          sessionMinutes={sessionMinutes}
          onTakeBreak={() => {}}
          onSkip={handleBreakToReview}
        />
      )}
      {phase === 'post' && (
        <PostSession onStartAnother={handleStartAnother} onGoHome={handleGoHome} />
      )}
    </motion.div>
  );
}
