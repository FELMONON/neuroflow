'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@/types/database';
import { TaskCard } from './TaskCard';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface TaskListProps {
  tasks: Task[];
  groupBy?: 'status' | 'none';
  onToggleComplete: (id: string) => void;
  onBreakDown: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onReorder: (taskIds: string[]) => void;
}

const statusLabels: Partial<Record<TaskStatus, string>> = {
  inbox: 'Inbox',
  today: 'Today',
  in_progress: 'In Progress',
  scheduled: 'Upcoming',
  done: 'Completed',
};

const statusOrder: TaskStatus[] = ['in_progress', 'today', 'scheduled', 'inbox', 'done'];

export function TaskList({
  tasks,
  groupBy = 'none',
  onToggleComplete,
  onBreakDown,
  onEdit,
  onReorder,
}: TaskListProps) {
  const reducedMotion = useReducedMotion();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = useMemo((): Record<string, Task[]> => {
    if (groupBy === 'none') return { all: tasks };
    const groups: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!groups[task.status]) groups[task.status] = [];
      groups[task.status].push(task);
    }
    return groups;
  }, [tasks, groupBy]);

  const sortedGroupKeys = useMemo(() => {
    if (groupBy === 'none') return ['all'];
    return statusOrder.filter((s) => grouped[s] && grouped[s].length > 0);
  }, [grouped, groupBy]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = tasks.map((t) => t.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const newIds = [...ids];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as string);
    onReorder(newIds);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-text-secondary">No tasks.</p>
        <p className="text-sm text-text-muted mt-1">Add one to get started.</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {sortedGroupKeys.map((key) => {
          const groupTasks = grouped[key] ?? [];
          const taskIds = groupTasks.map((t) => t.id);
          const label = key === 'all' ? null : statusLabels[key as TaskStatus] ?? key;

          return (
            <div key={key}>
              {label && (
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {label}
                  </h3>
                  <span className="text-xs text-text-muted bg-white/[0.06] px-2 py-0.5 rounded-full font-mono tabular-nums">
                    {groupTasks.length}
                  </span>
                </div>
              )}
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                <motion.div
                  className="space-y-2"
                  variants={reducedMotion ? undefined : staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {groupTasks.map((task) => (
                    <motion.div key={task.id} variants={reducedMotion ? undefined : staggerItem}>
                      <TaskCard
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onBreakDown={onBreakDown}
                        onEdit={onEdit}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
