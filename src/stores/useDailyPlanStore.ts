import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { TimeBlock, EnergyLevel } from '@/types/database';

// Lazy singleton
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isPersistedId(id: string): boolean {
  return UUID_RE.test(id);
}

// Time helpers
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getEnergyForHour(hour: number): EnergyLevel {
  if (hour >= 8 && hour < 11.5) return 'high';
  if (hour >= 11.5 && hour < 13) return 'medium';
  if (hour >= 13 && hour < 14) return 'medium';
  if (hour >= 14 && hour < 15.5) return 'low';
  if (hour >= 15.5 && hour < 17) return 'medium';
  return 'recharge';
}

function getEnergyRank(energy: EnergyLevel): number {
  const ranks: Record<EnergyLevel, number> = { high: 3, medium: 2, low: 1, recharge: 0 };
  return ranks[energy];
}

/** Extended block with id + isBreak for plan page compatibility */
export interface PlanTimeBlock extends TimeBlock {
  id: string;
  isBreak?: boolean;
}

interface UnscheduledTask {
  id: string;
  title: string;
  estimate: string;
  estimateMinutes: number;
  energy: EnergyLevel;
}

const BUFFER_DURATION = 10;

interface DailyPlanState {
  blocks: PlanTimeBlock[];
  unscheduledTasks: UnscheduledTask[];
  currentDate: string; // ISO date string (YYYY-MM-DD)
  isLoading: boolean;

  // Actions
  setBlocks: (blocks: PlanTimeBlock[]) => void;
  addBlock: (block: PlanTimeBlock) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (blockIds: string[]) => void;
  setUnscheduledTasks: (tasks: UnscheduledTask[]) => void;
  scheduleTask: (taskId: string) => void;
  smartSchedule: () => void;
  setCurrentDate: (date: string) => void;
  hydrateFromSupabase: () => Promise<void>;

  // Selectors
  getCurrentBlock: () => PlanTimeBlock | null;
  getNextBlock: () => PlanTimeBlock | null;
  getEnergyDistribution: () => Record<EnergyLevel, number>;
  getMismatches: () => PlanTimeBlock[];
}

export const useDailyPlanStore = create<DailyPlanState>((set, get) => ({
  blocks: [],
  unscheduledTasks: [],
  currentDate: '2026-01-01', // SSR-safe default, set to real date in useEffect
  isLoading: false,

  setBlocks: (blocks) => set({ blocks }),

  addBlock: (block) => {
    set((state) => ({ blocks: [...state.blocks, block] }));
  },

  removeBlock: (id) => {
    set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) }));
  },

  reorderBlocks: (blockIds) => {
    set((state) => {
      const ordered = blockIds
        .map((id) => state.blocks.find((b) => b.id === id))
        .filter(Boolean) as PlanTimeBlock[];
      const remaining = state.blocks.filter((b) => !blockIds.includes(b.id));
      return { blocks: [...ordered, ...remaining] };
    });
  },

  setUnscheduledTasks: (tasks) => set({ unscheduledTasks: tasks }),

  scheduleTask: (taskId) => {
    const { blocks, unscheduledTasks } = get();
    const task = unscheduledTasks.find((t) => t.id === taskId);
    if (!task) return;

    const lastBlock = blocks[blocks.length - 1];
    const lastEnd = lastBlock ? timeToMinutes(lastBlock.end) : timeToMinutes('08:00');
    const needsBuffer = lastBlock && !lastBlock.isBreak;
    const additions: PlanTimeBlock[] = [];
    let cursor = lastEnd;

    if (needsBuffer) {
      additions.push({
        id: `buffer-${Date.now()}`,
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + BUFFER_DURATION),
        label: 'Transition break',
        energy: 'recharge' as EnergyLevel,
        isBreak: true,
      });
      cursor += BUFFER_DURATION;
    }

    const endMin = cursor + task.estimateMinutes;
    if (endMin > 17 * 60) return;

    additions.push({
      id: `new-${Date.now()}`,
      start: minutesToTime(cursor),
      end: minutesToTime(endMin),
      label: task.title,
      energy: task.energy,
    });

    set((state) => ({
      blocks: [...state.blocks, ...additions],
      unscheduledTasks: state.unscheduledTasks.filter((t) => t.id !== taskId),
    }));
  },

  smartSchedule: () => {
    const { blocks, unscheduledTasks } = get();
    if (unscheduledTasks.length === 0) return;

    const endOfDay = 17 * 60;
    const lastBlock = blocks[blocks.length - 1];
    let startSlot: string | null;
    if (blocks.length === 0) {
      startSlot = '08:00';
    } else {
      const endMin = timeToMinutes(lastBlock.end);
      startSlot = endMin < endOfDay ? lastBlock.end : null;
    }
    if (!startSlot) return;

    let cursor = timeToMinutes(startSlot);
    if (cursor >= endOfDay) return;

    // Greedy energy-aware ordering
    const remaining = [...unscheduledTasks];
    const ordered: UnscheduledTask[] = [];
    let tempCursor = cursor;

    while (remaining.length > 0 && tempCursor < endOfDay) {
      const windowRank = getEnergyRank(getEnergyForHour(tempCursor / 60));
      let bestIdx = 0;
      let bestScore = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const score = Math.abs(getEnergyRank(remaining[i].energy) - windowRank);
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      ordered.push(remaining[bestIdx]);
      tempCursor += remaining[bestIdx].estimateMinutes + BUFFER_DURATION;
      remaining.splice(bestIdx, 1);
    }

    // Place ordered tasks with buffers
    const newBlocks: PlanTimeBlock[] = [];
    const scheduledTaskIds: string[] = [];
    const needsInitialBuffer = lastBlock && !lastBlock.isBreak;

    for (let i = 0; i < ordered.length; i++) {
      const task = ordered[i];
      if (i > 0 || needsInitialBuffer) {
        const bufferEnd = cursor + BUFFER_DURATION;
        if (bufferEnd + task.estimateMinutes > endOfDay) break;
        newBlocks.push({
          id: `buffer-${Date.now()}-${i}`,
          start: minutesToTime(cursor),
          end: minutesToTime(bufferEnd),
          label: 'Transition break',
          energy: 'recharge' as EnergyLevel,
          isBreak: true,
        });
        cursor = bufferEnd;
      }
      const endMin = cursor + task.estimateMinutes;
      if (endMin > endOfDay) break;
      newBlocks.push({
        id: `smart-${Date.now()}-${task.id}`,
        start: minutesToTime(cursor),
        end: minutesToTime(endMin),
        label: task.title,
        energy: task.energy,
      });
      scheduledTaskIds.push(task.id);
      cursor = endMin;
    }

    if (newBlocks.length === 0) return;

    set((state) => ({
      blocks: [...state.blocks, ...newBlocks],
      unscheduledTasks: state.unscheduledTasks.filter((t) => !scheduledTaskIds.includes(t.id)),
    }));
  },

  setCurrentDate: (date) => set({ currentDate: date }),

  hydrateFromSupabase: async () => {
    set({ isLoading: true });
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ isLoading: false }); return; }

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .single();

      if (data && data.time_blocks && data.time_blocks.length > 0) {
        const blocks: PlanTimeBlock[] = (data.time_blocks as TimeBlock[]).map((b, i) => ({
          ...b,
          id: `db-${i}`,
          isBreak: b.energy === 'recharge',
        }));
        set({ blocks });
      }
    } catch (err) {
      console.error('[useDailyPlanStore] hydration error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentBlock: () => {
    const { blocks } = get();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return blocks.find((b) => {
      const s = timeToMinutes(b.start);
      const e = timeToMinutes(b.end);
      return currentMinutes >= s && currentMinutes < e;
    }) ?? null;
  },

  getNextBlock: () => {
    const { blocks } = get();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return blocks.find((b) => timeToMinutes(b.start) > currentMinutes) ?? null;
  },

  getEnergyDistribution: () => {
    const { blocks } = get();
    const dist: Record<EnergyLevel, number> = { high: 0, medium: 0, low: 0, recharge: 0 };
    for (const b of blocks) {
      const duration = timeToMinutes(b.end) - timeToMinutes(b.start);
      dist[b.energy] += duration;
    }
    return dist;
  },

  getMismatches: () => {
    const { blocks } = get();
    return blocks.filter((b) => {
      if (b.isBreak) return false;
      const hour = parseInt(b.start.split(':')[0]);
      const predicted = getEnergyForHour(hour);
      return Math.abs(getEnergyRank(b.energy) - getEnergyRank(predicted)) >= 2;
    });
  },
}));
