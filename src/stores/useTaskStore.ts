import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus, EnergyLevel } from '@/types/database';

// Lazy singleton — created once on first mutation that needs Supabase
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

// Only sync with Supabase for real UUIDs (skip mock IDs like "1", "2")
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isPersistedId(id: string): boolean {
  return UUID_RE.test(id);
}

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  filter: TaskStatus | 'all';
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilter: (filter: TaskStatus | 'all') => void;
  completeTask: (id: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  getFilteredTasks: () => Task[];
  getTodayTasks: () => Task[];
  getInboxTasks: () => Task[];
  getQuickWins: () => Task[];
  getByEnergy: (energy: EnergyLevel) => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: 'all',

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => {
    set((state) => ({ tasks: [task, ...state.tasks] }));
    if (!isPersistedId(task.id)) return;
    const supabase = getSupabase();
    const { id, ...rest } = task;
    supabase.from('tasks').insert({ id, ...rest }).then(({ error }) => {
      if (error) console.error('[useTaskStore] addTask sync error:', error.message);
    });
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t)),
    }));
    if (!isPersistedId(id)) return;
    const supabase = getSupabase();
    supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('[useTaskStore] updateTask sync error:', error.message);
      });
  },

  deleteTask: (id) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    if (!isPersistedId(id)) return;
    const supabase = getSupabase();
    supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('[useTaskStore] deleteTask sync error:', error.message);
    });
  },

  setFilter: (filter) => set({ filter }),

  completeTask: (id) => {
    const now = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'done' as TaskStatus, completed_at: now } : t
      ),
    }));
    if (!isPersistedId(id)) return;
    const supabase = getSupabase();
    supabase
      .from('tasks')
      .update({ status: 'done' as TaskStatus, completed_at: now, updated_at: now })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('[useTaskStore] completeTask sync error:', error.message);
      });
  },

  reorderTasks: (taskIds) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        const idx = taskIds.indexOf(t.id);
        return idx >= 0 ? { ...t, sort_order: idx } : t;
      }),
    }));
    // Batch-update sort_order in Supabase (only for persisted tasks)
    const persistedIds = taskIds.filter(isPersistedId);
    if (persistedIds.length === 0) return;
    const supabase = getSupabase();
    Promise.all(
      persistedIds.map((taskId) =>
        supabase.from('tasks').update({ sort_order: taskIds.indexOf(taskId) }).eq('id', taskId),
      ),
    ).catch((err) => {
      console.error('[useTaskStore] reorderTasks sync error:', err);
    });
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    if (filter === 'all') return tasks.filter((t) => t.status !== 'archived');
    return tasks.filter((t) => t.status === filter);
  },

  getTodayTasks: () => {
    const { tasks } = get();
    return tasks
      .filter((t) => t.status === 'today' || t.status === 'in_progress')
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  getInboxTasks: () => get().tasks.filter((t) => t.status === 'inbox'),

  getQuickWins: () =>
    get().tasks.filter(
      (t) => t.status !== 'done' && t.status !== 'archived' && (t.estimated_minutes ?? 999) <= 10 && t.energy_required === 'low'
    ),

  getByEnergy: (energy) => get().tasks.filter((t) => t.energy_required === energy && t.status !== 'done' && t.status !== 'archived'),
}));
