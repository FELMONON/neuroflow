'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Pause, Play, Square } from 'lucide-react';
import { TimerRing } from './TimerRing';
import { ParkingLot } from './ParkingLot';
import { SoundscapeSelector } from './SoundscapeSelector';
import { useSessionStore } from '@/stores/useSessionStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useUIStore } from '@/stores/useUIStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { Button } from '@/components/ui';

interface ActiveSessionProps {
  onComplete: () => void;
}

function ActiveSession({ onComplete }: ActiveSessionProps) {
  const {
    currentSession, status, timeRemaining, parkingLot,
    soundscape, volume,
    pauseSession, resumeSession, setTimeRemaining, extendSession,
    endSession, setSoundscape, setVolume, addToParkingLot, removeParkingLotItem,
  } = useSessionStore();

  const tasks = useTaskStore((s) => s.tasks);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');
  const setFocusModeActive = useUIStore((s) => s.setFocusModeActive);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentTask = currentSession?.task_id
    ? tasks.find((t) => t.id === currentSession.task_id) ?? null
    : null;

  const totalDuration = (currentSession?.planned_duration ?? 25) * 60;
  const isPaused = status === 'paused';

  // Auto-collapse sidebar + set focus mode on mount
  useEffect(() => {
    setFocusModeActive(true);
    setSidebarOpen(false);
    return () => {
      setFocusModeActive(false);
    };
  }, [setFocusModeActive, setSidebarOpen]);

  // Timer countdown
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        const remaining = useSessionStore.getState().timeRemaining;
        if (remaining <= 1) {
          clearInterval(intervalRef.current!);
          endSession();
          onComplete();
        } else {
          setTimeRemaining(remaining - 1);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, endSession, onComplete, setTimeRemaining]);

  const handleEnd = useCallback(() => {
    endSession();
    onComplete();
  }, [endSession, onComplete]);

  const handleTogglePause = useCallback(() => {
    if (isPaused) resumeSession();
    else pauseSession();
  }, [isPaused, resumeSession, pauseSession]);

  // Keyboard shortcuts: Space = pause/resume, Escape = end
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in parking lot
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleEnd();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleEnd]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 px-4">
      <TimerRing timeRemaining={timeRemaining} totalDuration={totalDuration} isPaused={isPaused} />

      {/* Task label */}
      {currentTask ? (
        <p className="text-sm text-text-secondary">{currentTask.title}</p>
      ) : (
        <p className="text-sm text-text-muted">Open session — no task linked</p>
      )}

      {/* Soundscape */}
      <SoundscapeSelector
        selected={soundscape}
        onSelect={setSoundscape}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => extendSession(-5)}
          aria-label="Subtract 5 minutes"
          className="px-3 h-8 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
        >
          <span className="font-mono tabular-nums">-5</span>m
        </button>

        {/* Pause is the primary action — filled */}
        <Button
          variant="secondary"
          size="md"
          icon={isPaused ? <Play size={16} /> : <Pause size={16} />}
          onClick={handleTogglePause}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        {/* End is destructive — ghost so it's harder to hit accidentally */}
        <Button
          variant="ghost"
          size="md"
          icon={<Square size={14} />}
          onClick={handleEnd}
        >
          End
        </Button>

        <button
          onClick={() => extendSession(5)}
          aria-label="Add 5 minutes"
          className="px-3 h-8 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
        >
          <span className="font-mono tabular-nums">+5</span>m
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-[10px] text-white/[0.15]">
        Space to {isPaused ? 'resume' : 'pause'} &middot; Esc to end
      </p>

      {/* Parking lot — prominent, always visible */}
      <ParkingLot
        items={parkingLot.map((item) => item.content)}
        onAdd={(content) => {
          addToParkingLot({
            id: crypto.randomUUID(),
            user_id: profileId,
            content,
            captured_during_session_id: currentSession?.id ?? null,
            processed: false,
            converted_to_task_id: null,
            created_at: new Date().toISOString(),
          });
        }}
        onRemove={(i) => removeParkingLotItem(i)}
      />
    </div>
  );
}

export { ActiveSession };
export type { ActiveSessionProps };
