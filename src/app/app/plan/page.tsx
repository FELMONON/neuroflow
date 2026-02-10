'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Clock, Inbox, Zap, ArrowRight,
  Sun, Battery, Coffee, Play, AlertCircle, Sparkles,
} from 'lucide-react';
import { Card, Button, EmptyState } from '@/components/ui';
import { useDailyPlanStore, type PlanTimeBlock } from '@/stores/useDailyPlanStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getMorningPlan } from '@/lib/ai';
import type { EnergyLevel, TimeBlock as DBTimeBlock } from '@/types/database';
import clsx from 'clsx';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

type TimeBlock = PlanTimeBlock;

interface UnscheduledTask {
  id: string;
  title: string;
  estimate: string;
  estimateMinutes: number;
  energy: EnergyLevel;
}

const ENERGY_BORDER: Record<EnergyLevel, string> = {
  high: 'border-l-energy-high',
  medium: 'border-l-energy-medium',
  low: 'border-l-energy-low',
  recharge: 'border-l-energy-recharge',
};

const ENERGY_DOT: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

const ENERGY_LABEL: Record<EnergyLevel, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  recharge: 'Recharge',
};

const ENERGY_TEXT: Record<EnergyLevel, string> = {
  high: 'text-energy-high',
  medium: 'text-energy-medium',
  low: 'text-energy-low',
  recharge: 'text-energy-recharge',
};

const DEFAULT_ENERGY_PATTERN = {
  peak_start: '08:00',
  peak_end: '11:30',
  dip_start: '14:00',
  dip_end: '15:30',
};

function timeStrToHour(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
}

function getEnergyForHour(hour: number, pattern: typeof DEFAULT_ENERGY_PATTERN): EnergyLevel {
  const peakStart = timeStrToHour(pattern.peak_start);
  const peakEnd = timeStrToHour(pattern.peak_end);
  const dipStart = timeStrToHour(pattern.dip_start);
  const dipEnd = timeStrToHour(pattern.dip_end);

  if (hour >= peakStart && hour < peakEnd) return 'high';
  if (hour >= dipStart && hour < dipEnd) return 'low';
  if (hour >= 6 && hour < 20) return 'medium';
  return 'recharge';
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getBlockDuration(block: TimeBlock): number {
  return timeToMinutes(block.end) - timeToMinutes(block.start);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function findNextOpenSlot(blocks: TimeBlock[]): string | null {
  if (blocks.length === 0) return '08:00';
  const last = blocks[blocks.length - 1];
  const endMin = timeToMinutes(last.end);
  if (endMin < 17 * 60) return last.end;
  return null;
}

function getEnergyRank(energy: EnergyLevel): number {
  const ranks: Record<EnergyLevel, number> = { high: 3, medium: 2, low: 1, recharge: 0 };
  return ranks[energy];
}

function isSignificantMismatch(blockEnergy: EnergyLevel, predictedEnergy: EnergyLevel): boolean {
  return Math.abs(getEnergyRank(blockEnergy) - getEnergyRank(predictedEnergy)) >= 2;
}

/** ADHD guard: blocks over this threshold get a break suggestion */
const LONG_BLOCK_THRESHOLD = 60;

/** Buffer time between consecutive work blocks (minutes) */
const BUFFER_DURATION = 10;

/** Minutes past block end before showing hyperfocus alert */
const HYPERFOCUS_THRESHOLD = 15;

// Stable date for SSR — avoids hydration mismatch from new Date()
const SSR_DATE = new Date('2026-01-01T12:00:00');

export default function PlanPage() {
  const [currentDate, setCurrentDate] = useState<Date>(SSR_DATE);
  const [intentionOpen, setIntentionOpen] = useState(false);
  const [intention, setIntention] = useState('');
  const reducedMotion = useReducedMotion();
  const router = useRouter();

  // Store-driven state
  const blocks = useDailyPlanStore((s) => s.blocks);
  const tasks = useDailyPlanStore((s) => s.unscheduledTasks);
  const storeScheduleTask = useDailyPlanStore((s) => s.scheduleTask);
  const storeSmartSchedule = useDailyPlanStore((s) => s.smartSchedule);
  const setBlocks = useDailyPlanStore((s) => s.setBlocks);
  const setUnscheduledTasks = useDailyPlanStore((s) => s.setUnscheduledTasks);
  const allTasks = useTaskStore((s) => s.tasks);
  const profile = useProfileStore((s) => s.profile);
  const energyPattern = profile?.energy_pattern ?? DEFAULT_ENERGY_PATTERN;
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);

  // Current time + real date — hydration-safe (set after mount)
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
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

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }, []);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }, []);

  const isToday = useMemo(() => {
    const t = new Date();
    return currentDate.toDateString() === t.toDateString();
  }, [currentDate]);

  const nextSlot = useMemo(() => findNextOpenSlot(blocks), [blocks]);

  // Projected staggered times — each task starts after buffer + previous task
  const projectedSlots = useMemo(() => {
    const map = new Map<string, string>();
    if (!nextSlot) return map;
    let cursor = timeToMinutes(nextSlot);
    const endOfDay = 17 * 60;
    const lastBlock = blocks[blocks.length - 1];
    let needsBuffer = lastBlock ? !lastBlock.isBreak : false;

    for (const task of tasks) {
      if (needsBuffer) cursor += BUFFER_DURATION;
      if (cursor + task.estimateMinutes > endOfDay) break;
      map.set(task.id, minutesToTime(cursor));
      cursor += task.estimateMinutes;
      needsBuffer = true;
    }
    return map;
  }, [nextSlot, tasks, blocks]);

  const handleQuickAdd = useCallback(
    (taskId: string) => {
      storeScheduleTask(taskId);
    },
    [storeScheduleTask],
  );

  const handleStartFocus = useCallback(
    (block: TimeBlock) => {
      router.push('/app/focus');
    },
    [router],
  );

  const handleSmartSchedule = useCallback(() => {
    storeSmartSchedule();
  }, [storeSmartSchedule]);

  const handleAIPlan = useCallback(async () => {
    const todayTasks = allTasks.filter(
      (t) => t.status === 'today' || t.status === 'in_progress',
    );
    if (todayTasks.length === 0) return;

    const energyPattern = profile?.energy_pattern ?? {
      peak_start: '09:00', peak_end: '12:00',
      dip_start: '14:00', dip_end: '15:30',
    };

    setAiPlanLoading(true);
    setAiGreeting(null);

    try {
      const data = await getMorningPlan(todayTasks, energyPattern);

      if (data.timeBlocks && Array.isArray(data.timeBlocks)) {
        const newBlocks: PlanTimeBlock[] = (data.timeBlocks as DBTimeBlock[]).map((b, i) => ({
          ...b,
          id: `ai-${Date.now()}-${i}`,
          isBreak: b.energy === 'recharge',
        }));
        setBlocks(newBlocks);
        // Clear unscheduled since AI planned everything
        setUnscheduledTasks([]);
      }

      if (data.greeting) {
        setAiGreeting(data.greeting as string);
      }
    } catch (err) {
      console.warn('[PlanPage] AI plan unavailable:', err);
      // Silently fall back — user can still use Smart Schedule
    } finally {
      setAiPlanLoading(false);
    }
  }, [allTasks, profile, setBlocks, setUnscheduledTasks]);

  // Hyperfocus detection: alert when past a work block's end and not inside any block
  const hyperfocusAlert = useMemo(() => {
    if (!isToday || currentMinutes === null) return null;
    const insideAnyBlock = blocks.some((b) => {
      const s = timeToMinutes(b.start);
      const e = timeToMinutes(b.end);
      return currentMinutes >= s && currentMinutes < e;
    });
    if (insideAnyBlock) return null;
    let candidate: TimeBlock | null = null;
    let candidateEnd = 0;
    for (const block of blocks) {
      if (block.isBreak) continue;
      const endMin = timeToMinutes(block.end);
      if (currentMinutes > endMin && endMin > candidateEnd) {
        candidate = block;
        candidateEnd = endMin;
      }
    }
    if (!candidate) return null;
    const overrun = currentMinutes - candidateEnd;
    if (overrun < HYPERFOCUS_THRESHOLD || overrun > 90) return null;
    return { block: candidate, minutes: overrun };
  }, [blocks, currentMinutes, isToday]);

  const isCurrentBlock = useCallback(
    (block: TimeBlock): boolean => {
      if (!isToday || currentMinutes === null) return false;
      const start = timeToMinutes(block.start);
      const end = timeToMinutes(block.end);
      return currentMinutes >= start && currentMinutes < end;
    },
    [isToday, currentMinutes],
  );

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto flex flex-col gap-6 pb-24 md:pb-8"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <h1 className="text-2xl font-semibold text-text-primary">Daily Plan</h1>

      {/* Date nav */}
      <div className="flex items-center gap-1">
        <button onClick={handlePrev} className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-200 active:scale-[0.98] text-text-secondary cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-text-primary min-w-[200px] text-center px-3">
          {formatDate(currentDate)}
        </span>
        <button onClick={handleNext} className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-200 active:scale-[0.98] text-text-secondary cursor-pointer">
          <ChevronRight size={16} />
        </button>
        {!isToday && (
          <button onClick={() => setCurrentDate(new Date())} className="text-xs text-accent-flow hover:underline cursor-pointer ml-3 px-2 py-1 rounded-md bg-accent-flow/10 transition-all duration-200 active:scale-[0.98]">
            Today
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          {/* AI greeting — shown after AI generates a plan */}
          {aiGreeting && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl bg-accent-grow/[0.04] border border-accent-grow/[0.08]"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-grow/10 flex items-center justify-center shrink-0">
                <Sparkles size={14} className="text-accent-grow" />
              </div>
              <div>
                <span className="text-xs font-medium text-accent-grow">AI Planner</span>
                <p className="text-sm text-text-primary mt-0.5 leading-relaxed">{aiGreeting}</p>
              </div>
            </motion.div>
          )}

          {/* Intention — optional, collapsed by default */}
          {!intentionOpen && !intention.trim() ? (
            <button
              onClick={() => setIntentionOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/[0.08] text-sm text-text-muted hover:text-text-secondary hover:border-white/[0.12] hover:bg-white/[0.02] transition-all duration-200 cursor-pointer"
            >
              <Sun size={14} />
              <span>Set a morning intention</span>
            </button>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-secondary">Morning intention</label>
                {!intention.trim() && (
                  <button
                    onClick={() => setIntentionOpen(false)}
                    className="text-xs text-text-muted hover:text-text-secondary cursor-pointer transition-colors duration-150"
                  >
                    Skip
                  </button>
                )}
              </div>
              <textarea
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="What is your main focus for today?"
                rows={2}
                className="w-full bg-bg-tertiary border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent-flow/40 transition-colors duration-150"
              />
              {intention.trim() && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-accent-grow mt-2"
                >
                  Intention set. You showed up. That counts.
                </motion.p>
              )}
            </Card>
          )}

          {/* Energy forecast with legend */}
          <Card>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-text-muted" />
                <span className="text-sm font-medium text-text-secondary">Your energy pattern today</span>
              </div>
              <div className="flex items-center gap-3">
                {(['high', 'medium', 'low', 'recharge'] as const).map((level) => (
                  <span key={level} className="flex items-center gap-1">
                    <span className={clsx('w-2 h-2 rounded-full', ENERGY_DOT[level])} />
                    <span className="text-[10px] text-text-muted">{ENERGY_LABEL[level]}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-end gap-1">
              {Array.from({ length: 10 }, (_, i) => {
                const hour = 8 + i;
                const energy = getEnergyForHour(hour, energyPattern);
                const isCurrent = isToday && currentMinutes !== null && Math.floor(currentMinutes / 60) === hour;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className={clsx(
                        'w-full rounded-sm transition-all duration-200',
                        ENERGY_DOT[energy],
                        energy === 'high' ? 'h-8' : energy === 'medium' ? 'h-5' : energy === 'low' ? 'h-3' : 'h-2',
                        isCurrent && 'ring-2 ring-white/[0.4] ring-offset-1 ring-offset-bg-secondary',
                      )}
                    />
                    <span className={clsx(
                      'text-[10px] font-mono tabular-nums',
                      isCurrent ? 'text-text-primary font-medium' : 'text-text-muted',
                    )}>
                      {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'p' : 'a'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <Sun size={12} className="text-energy-high" />
                Peak: {energyPattern.peak_start}{'\u2013'}{energyPattern.peak_end}
              </span>
              <span className="flex items-center gap-1.5">
                <Battery size={12} className="text-energy-low" />
                Dip: {energyPattern.dip_start}{'\u2013'}{energyPattern.dip_end}
              </span>
            </div>
          </Card>

          {/* Hyperfocus alert */}
          {hyperfocusAlert && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-accent-sun/[0.06] border border-accent-sun/[0.12]"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-sun/10 flex items-center justify-center shrink-0">
                <AlertCircle size={14} className="text-accent-sun" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium">Hyperfocus check</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  You&apos;re {hyperfocusAlert.minutes}min past <span className="font-medium">{hyperfocusAlert.block.label}</span>. Take a breath — keep going or transition?
                </p>
              </div>
              <button
                onClick={() => router.push('/app/focus')}
                className="text-xs text-accent-flow font-medium px-3 py-1.5 rounded-lg bg-accent-flow/10 hover:bg-accent-flow/15 transition-colors shrink-0 cursor-pointer"
              >
                Start next
              </button>
            </motion.div>
          )}

          {/* Time blocks — proportional heights, now indicator, focus launcher */}
          <Card header={<div className="flex items-center gap-2"><Clock size={14} className="text-text-muted" /><span className="text-sm font-medium text-text-secondary">Time blocks</span></div>} noPadding>
            {blocks.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<Clock />}
                  title="No time blocks yet"
                  description="Structure your day with time blocks matched to your energy."
                />
              </div>
            ) : (
              <div>
                {blocks.map((block, blockIndex) => {
                  const duration = getBlockDuration(block);
                  const isCurrent = isCurrentBlock(block);
                  const energySuggestion = !block.isBreak ? getEnergyForHour(timeToMinutes(block.start) / 60, energyPattern) : null;
                  const isAligned = energySuggestion === block.energy;
                  const significantMismatch = energySuggestion !== null && !isAligned && isSignificantMismatch(block.energy, energySuggestion);
                  const isLongBlock = !block.isBreak && duration > LONG_BLOCK_THRESHOLD;

                  // Break suggestion midpoint for long blocks
                  const breakSuggestionTime = isLongBlock
                    ? minutesToTime(timeToMinutes(block.start) + Math.round(duration / 2))
                    : null;

                  // Missing buffer detection between consecutive work blocks
                  const prevBlock = blockIndex > 0 ? blocks[blockIndex - 1] : null;
                  const missingBuffer = prevBlock && !prevBlock.isBreak && !block.isBreak &&
                    timeToMinutes(block.start) - timeToMinutes(prevBlock.end) < BUFFER_DURATION;

                  // Proportional padding — longer blocks get more vertical space
                  const padY = block.isBreak
                    ? Math.min(12, Math.max(6, duration * 0.25))
                    : Math.min(32, Math.max(12, duration * 0.3));

                  return (
                      <div
                        key={block.id}
                        style={{
                          paddingTop: padY,
                          paddingBottom: padY,
                          ...(isCurrent && !block.isBreak
                            ? { boxShadow: 'inset 0 0 24px rgba(124, 106, 255, 0.06)' }
                            : {}),
                        }}
                        className={clsx(
                          'flex items-center gap-3 px-5 border-l-3 group relative transition-all duration-200',
                          'border-b border-b-white/[0.04]',
                          'last:border-b-0',
                          block.isBreak
                            ? 'border-l-white/[0.08] bg-white/[0.015]'
                            : ENERGY_BORDER[block.energy],
                          // NOW block: stronger visual — brighter bg + inner glow
                          isCurrent && !block.isBreak && 'bg-accent-flow/[0.08]',
                          isCurrent && block.isBreak && 'bg-white/[0.03]',
                          !block.isBreak && 'hover:bg-white/[0.03] cursor-pointer',
                          // Energy mismatch: subtle warning ring
                          significantMismatch && 'ring-1 ring-accent-sun/20',
                        )}
                        onClick={!block.isBreak ? () => handleStartFocus(block) : undefined}
                        role={!block.isBreak ? 'button' : undefined}
                        tabIndex={!block.isBreak ? 0 : undefined}
                        onKeyDown={!block.isBreak ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleStartFocus(block);
                          }
                        } : undefined}
                      >
                        {/* Now marker dot */}
                        {isCurrent && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2.5 h-2.5 rounded-full bg-accent-flow border-2 border-bg-secondary z-10" />
                        )}

                        {/* Start time */}
                        <span className={clsx(
                          'text-xs font-mono tabular-nums w-12 shrink-0',
                          isCurrent ? 'text-text-primary font-medium' : 'text-text-muted',
                        )}>
                          {block.start}
                        </span>

                        {/* Break icon */}
                        {block.isBreak && (
                          <Coffee size={13} className="text-white/[0.2] shrink-0" />
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <span className={clsx(
                            'text-sm',
                            block.isBreak ? 'text-text-muted italic' : 'text-text-primary',
                            isCurrent && !block.isBreak && 'font-medium',
                          )}>
                            {block.label}
                          </span>
                          {!block.isBreak ? (
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={clsx('w-1.5 h-1.5 rounded-full', ENERGY_DOT[block.energy])} />
                              <span className={clsx('text-xs', ENERGY_TEXT[block.energy])}>
                                {ENERGY_LABEL[block.energy]}
                              </span>
                              <span className="text-xs text-text-muted font-mono tabular-nums">{duration}m</span>
                              {/* Energy mismatch indicators */}
                              {energySuggestion && !isAligned && (
                                significantMismatch ? (
                                  <span className="text-xs text-accent-sun/80 flex items-center gap-1">
                                    <AlertCircle size={10} className="shrink-0" />
                                    <span>Mismatch — typically {ENERGY_LABEL[energySuggestion].toLowerCase()} energy here</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                                    (energy typically {ENERGY_LABEL[energySuggestion].toLowerCase()})
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/[0.2] font-mono tabular-nums">{duration}m</span>
                          )}
                          {/* ADHD guard: break suggestion for long blocks */}
                          {isLongBlock && breakSuggestionTime && (
                            <p className="flex items-center gap-1 mt-1 text-[10px] text-accent-sun/70">
                              <AlertCircle size={10} className="shrink-0" />
                              <span>Consider a break around {breakSuggestionTime}</span>
                            </p>
                          )}
                          {/* Missing buffer warning */}
                          {missingBuffer && (
                            <p className="flex items-center gap-1 mt-1 text-[10px] text-accent-sun/60">
                              <AlertCircle size={9} className="shrink-0" />
                              <span>No transition buffer — your brain needs a moment between tasks</span>
                            </p>
                          )}
                        </div>

                        {/* End time + Focus launcher */}
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          <span className={clsx(
                            'text-xs font-mono tabular-nums',
                            isCurrent ? 'text-text-secondary' : 'text-text-muted',
                          )}>
                            {block.end}
                          </span>

                          {/* NOW block: always-visible Focus button */}
                          {!block.isBreak && isCurrent && (
                            <span className="flex items-center gap-1 text-xs font-medium text-accent-flow bg-accent-flow/10 px-2 py-1 rounded-md">
                              <Play size={11} fill="currentColor" />
                              <span>Focus</span>
                            </span>
                          )}

                          {/* Other work blocks: hover-only Focus hint */}
                          {!block.isBreak && !isCurrent && (
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-accent-flow">
                              <Play size={12} fill="currentColor" />
                              <span className="hidden sm:inline">Focus</span>
                            </span>
                          )}
                        </div>

                        {/* Now badge */}
                        {isCurrent && (
                          <span className="absolute top-1.5 right-2 text-[9px] uppercase tracking-wider font-medium text-accent-flow bg-accent-flow/10 px-1.5 py-0.5 rounded">
                            Now
                          </span>
                        )}
                      </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card
            header={
              <div>
                <span className="text-sm font-medium text-text-secondary">Unscheduled tasks</span>
                <p className="text-[10px] text-text-muted mt-0.5">Colored by energy needed</p>
              </div>
            }
          >
            {tasks.length === 0 ? (
              <EmptyState
                icon={<Inbox />}
                title="All tasks scheduled"
                description="Nothing left to place. Nice work."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {/* Schedule buttons */}
                {tasks.length > 1 && nextSlot && (
                  <div className="flex flex-col gap-1.5 mb-1">
                    <button
                      onClick={handleSmartSchedule}
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg bg-accent-flow/[0.08] border border-accent-flow/[0.12] text-sm font-medium text-accent-flow hover:bg-accent-flow/[0.12] hover:border-accent-flow/[0.18] transition-all duration-200 cursor-pointer active:scale-[0.99]"
                    >
                      <Sparkles size={14} />
                      <span>Smart Schedule</span>
                    </button>
                    <button
                      onClick={handleAIPlan}
                      disabled={aiPlanLoading}
                      className={clsx(
                        'flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.99]',
                        aiPlanLoading
                          ? 'bg-accent-grow/[0.04] border-accent-grow/[0.08] text-accent-grow/60'
                          : 'bg-accent-grow/[0.08] border-accent-grow/[0.12] text-accent-grow hover:bg-accent-grow/[0.12] hover:border-accent-grow/[0.18]',
                      )}
                    >
                      <Sparkles size={14} />
                      <span>{aiPlanLoading ? 'AI is planning...' : 'AI Plan My Day'}</span>
                    </button>
                  </div>
                )}
                <AnimatePresence>
                  {tasks.map((task) => {
                    const slot = projectedSlots.get(task.id);
                    return (
                      <motion.button
                        key={task.id}
                        type="button"
                        layout
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        onClick={() => handleQuickAdd(task.id)}
                        disabled={!slot}
                        className={clsx(
                          'flex items-center gap-2 py-2.5 px-3 border rounded-lg transition-all duration-150 text-left w-full',
                          'border-l-2',
                          ENERGY_BORDER[task.energy],
                          slot
                            ? 'border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.10] cursor-pointer active:scale-[0.99]'
                            : 'border-white/[0.04] opacity-50',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-text-primary block truncate">{task.title}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={clsx('w-1.5 h-1.5 rounded-full', ENERGY_DOT[task.energy])} />
                            <span className="text-xs text-text-muted">{task.estimate}</span>
                          </div>
                        </div>
                        {slot && (
                          <span className="flex items-center gap-1 text-xs text-text-muted shrink-0">
                            <ArrowRight size={12} />
                            <span className="font-mono tabular-nums">{slot}</span>
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
                {tasks.length > 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    Tap to schedule sequentially from <span className="font-mono tabular-nums text-accent-flow">{nextSlot}</span>
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Energy tip */}
          <Card className="border-accent-flow/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-flow/10 flex items-center justify-center shrink-0">
                <Coffee size={14} className="text-accent-flow" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-secondary">Energy tip</span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Your energy dips around {energyPattern.dip_start}. Try scheduling low-effort tasks or a walk then.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
