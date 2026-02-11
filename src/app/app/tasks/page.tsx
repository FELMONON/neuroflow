'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Inbox } from 'lucide-react';
import { useTaskStore } from '@/stores/useTaskStore';
import { TaskList } from '@/components/features/tasks/TaskList';
import { TaskFilters, type FilterTab } from '@/components/features/tasks/TaskFilters';
import { TaskForm } from '@/components/features/tasks/TaskForm';
import { AIBreakdown } from '@/components/features/tasks/AIBreakdown';
import { InboxProcessor, type InboxAction } from '@/components/features/tasks/InboxProcessor';
import { QuickAddBar } from '@/components/features/tasks/QuickAddBar';
import { Button, Badge, EmptyState } from '@/components/ui';
import { useProfileStore } from '@/stores/useProfileStore';
import { SEED_TASKS } from '@/lib/seed-data';
import type { Task, Subtask } from '@/types/database';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

function getNextWeek() {
  return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
}

function createNewTask(profileId: string, sortOrder: number, taskData: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(), user_id: profileId,
    title: taskData.title ?? '', description: taskData.description ?? null,
    status: taskData.status ?? 'inbox', priority: taskData.priority ?? 'medium',
    energy_required: taskData.energy_required ?? 'medium',
    estimated_minutes: taskData.estimated_minutes ?? null, actual_minutes: null,
    interest_level: taskData.interest_level ?? 3, due_date: null, due_time: null,
    scheduled_date: null, scheduled_block: null, parent_task_id: null,
    sort_order: sortOrder, tags: [], ai_subtasks: null, completed_at: null,
    xp_value: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
}

export default function TasksPage() {
  const { tasks, addTask, updateTask, completeTask, deleteTask, reorderTasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');
  const reducedMotion = useReducedMotion();

  const inboxTasks = useMemo(() => tasks.filter((t) => t.status === 'inbox'), [tasks]);

  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case 'today': return tasks.filter((t) => t.status === 'today' || t.status === 'in_progress').sort((a, b) => a.sort_order - b.sort_order);
      case 'inbox': return tasks.filter((t) => t.status === 'inbox').sort((a, b) => a.sort_order - b.sort_order);
      case 'done': return tasks.filter((t) => t.status === 'done').sort((a, b) => a.sort_order - b.sort_order);
      default: return tasks.filter((t) => t.status !== 'archived').sort((a, b) => a.sort_order - b.sort_order);
    }
  }, [tasks, activeTab]);

  const groupBy = activeTab === 'all' ? 'status' as const : 'none' as const;

  const handleToggleComplete = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'done') { updateTask(id, { status: 'today', completed_at: null }); } else { completeTask(id); }
  }, [tasks, updateTask, completeTask]);

  const handleAddTask = useCallback((taskData: Partial<Task>) => {
    if (!profileId) return;
    addTask(createNewTask(profileId, tasks.length, taskData));
  }, [tasks.length, addTask, profileId]);

  const handleEditTask = useCallback((taskData: Partial<Task>) => {
    if (editingTask) { updateTask(editingTask.id, taskData); setEditingTask(null); }
  }, [editingTask, updateTask]);

  const handleApplyBreakdown = useCallback((taskId: string, subtasks: Subtask[]) => {
    updateTask(taskId, { ai_subtasks: subtasks });
  }, [updateTask]);

  const profileReady = profileId.length > 0;

  const handleQuickAdd = useCallback((title: string) => {
    if (!profileReady) return;
    handleAddTask({ title, status: 'inbox' });
  }, [handleAddTask, profileReady]);

  const handleLoadStarter = useCallback(() => {
    if (!profileId) return;
    const now = new Date().toISOString();
    for (const seed of SEED_TASKS) {
      addTask({
        ...seed,
        id: crypto.randomUUID(),
        user_id: profileId,
        status: seed.status === 'done' ? 'done' : 'today',
        completed_at: seed.status === 'done' ? now : null,
        created_at: now,
        updated_at: now,
      });
    }
  }, [profileId, addTask]);

  const handleInboxAction = useCallback((taskId: string, action: InboxAction) => {
    switch (action) {
      case 'do-now': updateTask(taskId, { status: 'in_progress' }); break;
      case 'schedule': updateTask(taskId, { status: 'scheduled', scheduled_date: getNextWeek() }); break;
      case 'break-down': {
        const task = tasks.find((t) => t.id === taskId);
        if (task) { updateTask(taskId, { status: 'today' }); setShowInbox(false); setTimeout(() => setBreakdownTask(task), 300); }
        break;
      }
      case 'delegate': updateTask(taskId, { status: 'archived' }); break;
      case 'delete': deleteTask(taskId); break;
    }
  }, [tasks, updateTask, deleteTask]);

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto pb-24"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial" animate="animate" exit="exit" transition={pageTransition}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold text-text-primary">Tasks</h1>
          {inboxTasks.length > 0 && (
            <Button variant="secondary" size="sm" icon={<Inbox size={14} />} onClick={() => setShowInbox(true)}>
              Inbox<Badge className="ml-2">{inboxTasks.length}</Badge>
            </Button>
          )}
        </div>
        <p className="text-sm text-text-secondary">{filteredTasks.filter((t) => t.status !== 'done').length} active</p>
      </div>

      <div className="mb-6"><TaskFilters activeTab={activeTab} onTabChange={setActiveTab} /></div>
      <QuickAddBar onAdd={handleQuickAdd} />

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3">
          <EmptyState icon={<Inbox />} title="Your inbox is clear"
            description="Nothing here right now — capture something new whenever it pops into your head."
            action={{ label: 'Add a Task', onClick: () => setShowTaskForm(true) }}
          />
          {tasks.length === 0 && (
            <Button variant="secondary" size="sm" onClick={handleLoadStarter}>
              Load starter tasks
            </Button>
          )}
        </div>
      ) : (
        <TaskList tasks={filteredTasks} groupBy={groupBy} onToggleComplete={handleToggleComplete}
          onBreakDown={setBreakdownTask} onEdit={(task) => setEditingTask(task)} onReorder={reorderTasks}
        />
      )}

      <div className="fixed bottom-8 right-8 z-40 sm:hidden">
        <button onClick={() => profileReady && setShowTaskForm(true)}
          disabled={!profileReady}
          className="w-14 h-14 rounded-full bg-accent-flow text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-accent-flow/80 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Add task"
        ><Plus size={24} /></button>
      </div>

      <TaskForm open={showTaskForm && profileReady} onClose={() => setShowTaskForm(false)} onSubmit={handleAddTask} mode="create" />
      <TaskForm open={!!editingTask} onClose={() => setEditingTask(null)} onSubmit={handleEditTask} initialTask={editingTask ?? undefined} mode="edit" />
      <AIBreakdown open={!!breakdownTask} onClose={() => setBreakdownTask(null)} task={breakdownTask} onApply={handleApplyBreakdown} />
      <InboxProcessor open={showInbox} onClose={() => setShowInbox(false)} tasks={inboxTasks} onAction={handleInboxAction} />
    </motion.div>
  );
}
