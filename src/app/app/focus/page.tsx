'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Skeleton } from '@/components/ui';
import { BreakPhase } from '@/components/features/focus/BreakPhase';
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

export default function FocusPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const router = useRouter();
  const startSession = useSessionStore((s) => s.startSession);
  const currentSession = useSessionStore((s) => s.currentSession);
  const setStatus = useSessionStore((s) => s.setStatus);
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
    if (currentSession) {
      onFocusSessionComplete(currentSession.id);
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
          onTakeBreak={() => setStatus('break')}
          onSkip={handleBreakToReview}
        />
      )}
      {phase === 'post' && (
        <PostSession onStartAnother={handleStartAnother} onGoHome={handleGoHome} />
      )}
    </motion.div>
  );
}
