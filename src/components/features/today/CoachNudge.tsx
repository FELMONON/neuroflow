'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCoachNudge } from '@/lib/ai';
import { useProfileStore } from '@/stores/useProfileStore';
import { useTaskStore } from '@/stores/useTaskStore';

interface NudgeData {
  message: string;
  suggestion?: string;
  action?: string;
}

const ACTION_ROUTES: Record<string, string> = {
  start_focus: '/app/focus',
  take_break: '/app/focus',
  body_double: '/app/body-double',
  dopamine_menu: '/app/dopamine-menu',
};

export function CoachNudge() {
  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fetchedRef = useRef(false);
  const router = useRouter();

  const latestCheckIn = useProfileStore((s) => s.latestCheckIn);
  const tasks = useTaskStore((s) => s.tasks);

  const fetchNudge = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);

    try {
      const completedCount = tasks.filter((t) => t.status === 'done').length;
      const remainingCount = tasks.filter(
        (t) => t.status === 'today' || t.status === 'in_progress',
      ).length;

      const data = await getCoachNudge({
        currentMood: latestCheckIn?.mood ?? undefined,
        currentEnergy: latestCheckIn?.energy ?? undefined,
        tasksCompleted: completedCount,
        tasksRemaining: remainingCount,
      });

      if (data.message) {
        setNudge(data as NudgeData);
      }
    } catch (err) {
      // Graceful degradation — no nudge shown
      console.warn('[CoachNudge] AI unavailable:', err);
    } finally {
      setLoading(false);
    }
  }, [tasks, latestCheckIn]);

  useEffect(() => {
    // Delay fetch slightly so it doesn't block page render
    const timer = setTimeout(fetchNudge, 800);
    return () => clearTimeout(timer);
  }, [fetchNudge]);

  const handleAction = useCallback(() => {
    if (nudge?.action && ACTION_ROUTES[nudge.action]) {
      router.push(ACTION_ROUTES[nudge.action]);
    }
  }, [nudge, router]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-bg-secondary rounded-xl border border-accent-flow/[0.08] px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent-flow animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-sm text-text-muted">Coach is thinking...</span>
          </div>
        </motion.div>
      )}

      {nudge && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-bg-secondary rounded-xl border border-accent-flow/[0.08] px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-flow/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={14} className="text-accent-flow" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-accent-flow">AI Coach</span>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-text-muted hover:text-text-secondary transition-colors cursor-pointer p-0.5 rounded-lg focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                  aria-label="Dismiss coach nudge"
                >
                  <X size={12} />
                </button>
              </div>

              <p className="text-sm text-text-primary leading-relaxed">
                {nudge.message}
              </p>

              {nudge.suggestion && (
                <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                  {nudge.suggestion}
                </p>
              )}

              {nudge.action && ACTION_ROUTES[nudge.action] && (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-1.5 mt-2.5 text-xs font-medium text-accent-flow hover:text-accent-flow/80 transition-colors cursor-pointer rounded-lg focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none"
                >
                  <span>
                    {nudge.action === 'start_focus' && 'Start a focus session'}
                    {nudge.action === 'take_break' && 'Take a break'}
                    {nudge.action === 'body_double' && 'Find a body double'}
                    {nudge.action === 'dopamine_menu' && 'Open dopamine menu'}
                  </span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
