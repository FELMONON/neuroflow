'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Coffee } from 'lucide-react';
import { Card } from '@/components/ui';
import { EnergyForecast } from '@/components/features/plan/EnergyForecast';
import { TimeBlockList } from '@/components/features/plan/TimeBlockList';
import { UnscheduledSidebar } from '@/components/features/plan/UnscheduledSidebar';
import { IntentionCard } from '@/components/features/plan/IntentionCard';
import { HyperfocusAlert } from '@/components/features/plan/HyperfocusAlert';
import { useDailyPlanStore, type PlanTimeBlock } from '@/stores/useDailyPlanStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getMorningPlan } from '@/lib/ai';
import type { TimeBlock as DBTimeBlock } from '@/types/database';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

const DEFAULT_ENERGY_PATTERN = {
  peak_start: '08:00', peak_end: '11:30',
  dip_start: '14:00', dip_end: '15:30',
};
const BUFFER_DURATION = 10;
const SSR_DATE = new Date('2026-01-01T12:00:00');

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function findNextOpenSlot(blocks: PlanTimeBlock[], endOfDay: number = 22 * 60): string | null {
  if (blocks.length === 0) return '08:00';
  const last = blocks[blocks.length - 1];
  return timeToMinutes(last.end) < endOfDay ? last.end : null;
}

export default function PlanPage() {
  const [currentDate, setCurrentDate] = useState<Date>(SSR_DATE);
  const [intentionOpen, setIntentionOpen] = useState(false);
  const [intention, setIntention] = useState('');
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  const blocks = useDailyPlanStore((s) => s.blocks);
  const tasks = useDailyPlanStore((s) => s.unscheduledTasks);
  const storeScheduleTask = useDailyPlanStore((s) => s.scheduleTask);
  const storeSmartSchedule = useDailyPlanStore((s) => s.smartSchedule);
  const setBlocks = useDailyPlanStore((s) => s.setBlocks);
  const setUnscheduledTasks = useDailyPlanStore((s) => s.setUnscheduledTasks);
  const hydrateFromSupabase = useDailyPlanStore((s) => s.hydrateFromSupabase);
  const allTasks = useTaskStore((s) => s.tasks);
  const profile = useProfileStore((s) => s.profile);
  const energyPattern = profile?.energy_pattern ?? DEFAULT_ENERGY_PATTERN;

  useEffect(() => {
    setCurrentDate(new Date());
    const now = new Date();
    setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    const interval = setInterval(() => {
      const n = new Date();
      setCurrentMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch blocks from Supabase whenever the displayed date changes
  useEffect(() => {
    const dateStr = currentDate.toISOString().split('T')[0];
    // Skip the SSR-safe default date
    if (dateStr === '2026-01-01') return;
    hydrateFromSupabase(dateStr);
  }, [currentDate, hydrateFromSupabase]);

  // Populate unscheduled tasks from the task store
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const scheduledTaskIds = new Set(
      blocks
        .filter((b) => b.task_id)
        .map((b) => b.task_id as string),
    );
    const unscheduled = allTasks
      .filter((t) => {
        if (t.status === 'done' || t.status === 'archived') return false;
        if (scheduledTaskIds.has(t.id)) return false;
        // Include tasks due today, overdue, or with no due date
        if (t.due_date && t.due_date > today) return false;
        return true;
      })
      .map((t) => ({
        id: t.id,
        title: t.title,
        estimate: `${t.estimated_minutes ?? 25}m`,
        estimateMinutes: t.estimated_minutes ?? 25,
        energy: t.energy_required,
      }));
    setUnscheduledTasks(unscheduled);
  }, [allTasks, blocks, setUnscheduledTasks]);

  const isToday = useMemo(() => currentDate.toDateString() === new Date().toDateString(), [currentDate]);
  const endOfDayMinutes = useMemo(() => {
    const dipEnd = energyPattern.dip_end;
    return dipEnd ? Math.min(timeToMinutes(dipEnd) + 4 * 60, 22 * 60) : 22 * 60;
  }, [energyPattern]);
  const nextSlot = useMemo(() => findNextOpenSlot(blocks, endOfDayMinutes), [blocks, endOfDayMinutes]);

  const projectedSlots = useMemo(() => {
    const map = new Map<string, string>();
    if (!nextSlot) return map;
    let cursor = timeToMinutes(nextSlot);
    const lastBlock = blocks[blocks.length - 1];
    let needsBuffer = lastBlock ? !lastBlock.isBreak : false;
    for (const task of tasks) {
      if (needsBuffer) cursor += BUFFER_DURATION;
      if (cursor + task.estimateMinutes > endOfDayMinutes) break;
      map.set(task.id, minutesToTime(cursor));
      cursor += task.estimateMinutes;
      needsBuffer = true;
    }
    return map;
  }, [nextSlot, tasks, blocks, endOfDayMinutes]);

  const hyperfocusAlert = useMemo(() => {
    if (!isToday || currentMinutes === null) return null;
    const insideAnyBlock = blocks.some((b) => currentMinutes >= timeToMinutes(b.start) && currentMinutes < timeToMinutes(b.end));
    if (insideAnyBlock) return null;
    let candidate: PlanTimeBlock | null = null;
    let candidateEnd = 0;
    for (const block of blocks) {
      if (block.isBreak) continue;
      const endMin = timeToMinutes(block.end);
      if (currentMinutes > endMin && endMin > candidateEnd) { candidate = block; candidateEnd = endMin; }
    }
    if (!candidate) return null;
    const overrun = currentMinutes - candidateEnd;
    return overrun >= 15 && overrun <= 90 ? { block: candidate, minutes: overrun } : null;
  }, [blocks, currentMinutes, isToday]);

  const handleAIPlan = useCallback(async () => {
    const todayTasks = allTasks.filter((t) => t.status === 'today' || t.status === 'in_progress');
    if (todayTasks.length === 0) return;
    const ep = profile?.energy_pattern ?? { peak_start: '09:00', peak_end: '12:00', dip_start: '14:00', dip_end: '15:30' };
    setAiPlanLoading(true);
    setAiGreeting(null);
    try {
      const data = await getMorningPlan(todayTasks, ep);
      if (data && typeof data === 'object' && Array.isArray(data.timeBlocks)) {
        setBlocks((data.timeBlocks as DBTimeBlock[]).map((b: DBTimeBlock, i: number) => ({ ...b, id: `ai-${Date.now()}-${i}`, isBreak: b.energy === 'recharge' })));
        setUnscheduledTasks([]);
      }
      if (data && typeof data === 'object' && typeof data.greeting === 'string') setAiGreeting(data.greeting);
    } catch (err) { console.warn('[PlanPage] AI plan unavailable:', err); }
    finally { setAiPlanLoading(false); }
  }, [allTasks, profile, setBlocks, setUnscheduledTasks]);

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto flex flex-col gap-6 pb-24 md:pb-8"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial" animate="animate" exit="exit" transition={pageTransition}
    >
      <h1 className="text-2xl font-semibold text-text-primary">Daily Plan</h1>

      <div className="flex items-center gap-1">
        <button onClick={() => setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })} className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-200 active:scale-[0.98] text-text-secondary cursor-pointer"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium text-text-primary min-w-[200px] text-center px-3">{formatDate(currentDate)}</span>
        <button onClick={() => setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })} className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-200 active:scale-[0.98] text-text-secondary cursor-pointer"><ChevronRight size={16} /></button>
        {!isToday && (
          <button onClick={() => setCurrentDate(new Date())} className="text-xs text-accent-flow hover:underline cursor-pointer ml-3 px-2 py-1 rounded-md bg-accent-flow/10 transition-all duration-200 active:scale-[0.98]">Today</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="flex flex-col gap-4">
          {aiGreeting && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-4 rounded-xl bg-accent-grow/[0.04] border border-accent-grow/[0.08]">
              <div className="w-8 h-8 rounded-lg bg-accent-grow/10 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-accent-grow" /></div>
              <div><span className="text-xs font-medium text-accent-grow">AI Planner</span><p className="text-sm text-text-primary mt-0.5 leading-relaxed">{aiGreeting}</p></div>
            </motion.div>
          )}
          <IntentionCard intentionOpen={intentionOpen} intention={intention} onOpen={() => setIntentionOpen(true)} onClose={() => setIntentionOpen(false)} onChange={setIntention} />
          <EnergyForecast energyPattern={energyPattern} isToday={isToday} currentMinutes={currentMinutes} />
          {hyperfocusAlert && <HyperfocusAlert minutes={hyperfocusAlert.minutes} blockLabel={hyperfocusAlert.block.label} onStartNext={() => router.push('/app/focus')} />}
          <TimeBlockList blocks={blocks} energyPattern={energyPattern} isToday={isToday} currentMinutes={currentMinutes} onStartFocus={() => router.push('/app/focus')} />
        </div>
        <div className="flex flex-col gap-4">
          <UnscheduledSidebar tasks={tasks} projectedSlots={projectedSlots} nextSlot={nextSlot} aiPlanLoading={aiPlanLoading} onQuickAdd={storeScheduleTask} onSmartSchedule={storeSmartSchedule} onAIPlan={handleAIPlan} />
          <Card className="border-accent-flow/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-flow/10 flex items-center justify-center shrink-0"><Coffee size={14} className="text-accent-flow" /></div>
              <div className="flex flex-col gap-1"><span className="text-xs font-medium text-text-secondary">Energy tip</span><p className="text-xs text-text-muted leading-relaxed">Your energy dips around {energyPattern.dip_start}. Try scheduling low-effort tasks or a walk then.</p></div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
