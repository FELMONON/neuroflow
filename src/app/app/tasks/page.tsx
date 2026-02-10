'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus, Inbox } from 'lucide-react';
import { useTaskStore } from '@/stores/useTaskStore';
import { TaskList } from '@/components/features/tasks/TaskList';
import { TaskFilters, type FilterTab } from '@/components/features/tasks/TaskFilters';
import { TaskForm } from '@/components/features/tasks/TaskForm';
import { AIBreakdown } from '@/components/features/tasks/AIBreakdown';
import { InboxProcessor, type InboxAction } from '@/components/features/tasks/InboxProcessor';
import { Button, Badge, EmptyState } from '@/components/ui';
import { useProfileStore } from '@/stores/useProfileStore';
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

export default function TasksPage() {
  const {
    tasks, addTask, updateTask, completeTask, deleteTask, reorderTasks,
  } = useTaskStore();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [breakdownTask, setBreakdownTask] = useState<Task | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const quickAddRef = useRef<HTMLInputElement>(null);
  const profileId = useProfileStore((s) => s.profile?.id ?? '');

  const inboxTasks = useMemo(() => tasks.filter((t) => t.status === 'inbox'), [tasks]);

  const filteredTasks = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return tasks.filter((t) => t.status === 'today' || t.status === 'in_progress').sort((a, b) => a.sort_order - b.sort_order);
      case 'inbox':
        return tasks.filter((t) => t.status === 'inbox').sort((a, b) => a.sort_order - b.sort_order);
      case 'done':
        return tasks.filter((t) => t.status === 'done').sort((a, b) => a.sort_order - b.sort_order);
      default:
        return tasks.filter((t) => t.status !== 'archived').sort((a, b) => a.sort_order - b.sort_order);
    }
  }, [tasks, activeTab]);

  const groupBy = activeTab === 'all' ? 'status' as const : 'none' as const;

  const handleToggleComplete = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === 'done') {
      updateTask(id, { status: 'today', completed_at: null });
    } else {
      completeTask(id);
    }
  }, [tasks, updateTask, completeTask]);

  const handleAddTask = useCallback((taskData: Partial<Task>) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      user_id: profileId,
      title: taskData.title ?? '',
      description: taskData.description ?? null,
      status: taskData.status ?? 'inbox',
      priority: taskData.priority ?? 'medium',
      energy_required: taskData.energy_required ?? 'medium',
      estimated_minutes: taskData.estimated_minutes ?? null,
      actual_minutes: null,
      interest_level: taskData.interest_level ?? 3,
      due_date: null,
      due_time: null,
      scheduled_date: null,
      scheduled_block: null,
      parent_task_id: null,
      sort_order: tasks.length,
      tags: [],
      ai_subtasks: null,
      completed_at: null,
      xp_value: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addTask(newTask);
  }, [tasks.length, addTask]);

  const handleEditTask = useCallback((taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      setEditingTask(null);
    }
  }, [editingTask, updateTask]);

  const handleApplyBreakdown = useCallback((taskId: string, subtasks: Subtask[]) => {
    updateTask(taskId, { ai_subtasks: subtasks });
  }, [updateTask]);

  const handleQuickAdd = useCallback(() => {
    const title = quickAddTitle.trim();
    if (!title) return;
    handleAddTask({ title, status: 'inbox' });
    setQuickAddTitle('');
    quickAddRef.current?.focus();
  }, [quickAddTitle, handleAddTask]);

  const handleInboxAction = useCallback((taskId: string, action: InboxAction) => {
    switch (action) {
      case 'do-now': updateTask(taskId, { status: 'in_progress' }); break;
      case 'schedule': updateTask(taskId, { status: 'scheduled', scheduled_date: getNextWeek() }); break;
      case 'break-down': {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          updateTask(taskId, { status: 'today' });
          setShowInbox(false);
          setTimeout(() => setBreakdownTask(task), 300);
        }
        break;
      }
      case 'delegate': updateTask(taskId, { status: 'archived' }); break;
      case 'delete': deleteTask(taskId); break;
    }
  }, [tasks, updateTask, deleteTask]);

  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto pb-24"
      variants={reducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-semibold text-text-primary">Tasks</h1>
          {inboxTasks.length > 0 && (
            <Button variant="secondary" size="sm" icon={<Inbox size={14} />} onClick={() => setShowInbox(true)}>
              Inbox
              <Badge className="ml-2">{inboxTasks.length}</Badge>
            </Button>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          {filteredTasks.filter((t) => t.status !== 'done').length} active
        </p>
      </div>

      <div className="mb-6">
        <TaskFilters activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="hidden sm:flex items-center gap-2 mb-6 bg-bg-secondary border border-white/[0.06] rounded-xl px-4 py-2">
        <Plus size={16} className="text-text-muted shrink-0" />
        <input
          ref={quickAddRef}
          type="text"
          value={quickAddTitle}
          onChange={(e) => setQuickAddTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        {quickAddTitle.trim() && (
          <button
            onClick={handleQuickAdd}
            className="text-xs font-medium text-accent-flow hover:text-accent-flow/80 transition-all duration-200 active:scale-[0.98] cursor-pointer px-2 py-1"
          >
            Add
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="Your inbox is clear"
          description="Nothing here right now — capture something new whenever it pops into your head."
          action={{ label: 'Add a Task', onClick: () => setShowTaskForm(true) }}
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          groupBy={groupBy}
          onToggleComplete={handleToggleComplete}
          onBreakDown={setBreakdownTask}
          onEdit={(task) => setEditingTask(task)}
          onReorder={reorderTasks}
        />
      )}

      <div className="fixed bottom-8 right-8 z-40 sm:hidden">
        <button
          onClick={() => setShowTaskForm(true)}
          className="w-14 h-14 rounded-full bg-accent-flow text-white shadow-lg flex items-center justify-center cursor-pointer hover:bg-accent-flow/80 transition-all duration-200 active:scale-[0.98]"
          aria-label="Add task"
        >
          <Plus size={24} />
        </button>
      </div>

      <TaskForm open={showTaskForm} onClose={() => setShowTaskForm(false)} onSubmit={handleAddTask} mode="create" />
      <TaskForm open={!!editingTask} onClose={() => setEditingTask(null)} onSubmit={handleEditTask} initialTask={editingTask ?? undefined} mode="edit" />
      <AIBreakdown open={!!breakdownTask} onClose={() => setBreakdownTask(null)} task={breakdownTask} onApply={handleApplyBreakdown} />
      <InboxProcessor open={showInbox} onClose={() => setShowInbox(false)} tasks={inboxTasks} onAction={handleInboxAction} />
    </motion.div>
  );
}
