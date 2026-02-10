'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ListChecks } from 'lucide-react';
import { XPPop, EmptyState } from '@/components/ui';
import type { EnergyLevel, TaskPriority } from '@/types/database';
import clsx from 'clsx';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};
const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface TaskItem {
  id: string;
  title: string;
  energyRequired: EnergyLevel;
  priority?: TaskPriority;
  completed: boolean;
}

const PRIORITY_STYLES: Record<TaskPriority, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'text-accent-spark' },
  high: { label: 'High', color: 'text-energy-high' },
  medium: { label: 'Med', color: 'text-energy-medium' },
  low: { label: 'Low', color: 'text-text-muted' },
};

interface TodayTasksProps {
  initialTasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onReorder: (taskIds: string[]) => void;
}

const energyDotColor: Record<EnergyLevel, string> = {
  high: 'bg-energy-high',
  medium: 'bg-energy-medium',
  low: 'bg-energy-low',
  recharge: 'bg-energy-recharge',
};

function SortableTask({
  task,
  onToggle,
}: {
  task: TaskItem;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const prevCompleted = useRef(task.completed);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (task.completed && !prevCompleted.current) {
      prevCompleted.current = task.completed;
      const startTimer = setTimeout(() => setJustCompleted(true), 0);
      const endTimer = setTimeout(() => setJustCompleted(false), 300);
      return () => { clearTimeout(startTimer); clearTimeout(endTimer); };
    }
    prevCompleted.current = task.completed;
  }, [task.completed]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
        isDragging ? 'opacity-60 z-10' : ''
      } ${task.completed ? '' : 'hover:bg-white/[0.03]'}`}
      {...attributes}
      {...listeners}
    >
      <div className="relative shrink-0">
        <button
          onClick={onToggle}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none cursor-pointer transition-all duration-200 active:scale-[0.98]"
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          <span
            className={`w-[18px] h-[18px] rounded border-[1.5px] flex items-center justify-center transition-all duration-150 ${
              task.completed
                ? 'bg-accent-grow border-accent-grow'
                : 'border-white/20 hover:border-accent-grow/50'
            } ${justCompleted ? 'animate-celebrate-check' : ''}`}
          >
            {task.completed && (
              <Check
                size={11}
                className={`text-white ${justCompleted ? 'animate-check-icon' : ''}`}
                strokeWidth={3}
              />
            )}
          </span>
        </button>
        <XPPop amount={15} trigger={justCompleted} />
      </div>

      <span
        className={`flex-1 text-sm transition-colors duration-150 ${
          task.completed
            ? 'line-through text-text-muted opacity-60'
            : 'text-text-primary'
        }`}
      >
        {task.title}
      </span>

      {/* Priority label + energy dot */}
      <div className="flex items-center gap-1.5 shrink-0">
        {task.priority && !task.completed && (
          <span className={clsx('text-[10px] font-medium', PRIORITY_STYLES[task.priority].color)}>
            {PRIORITY_STYLES[task.priority].label}
          </span>
        )}
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${energyDotColor[task.energyRequired]}`}
          title={`${task.energyRequired} energy`}
          aria-label={`${task.energyRequired} energy`}
        />
      </div>
    </div>
  );
}

export function TodayTasks({ initialTasks, onToggleTask, onReorder }: TodayTasksProps) {
  const reducedMotion = useReducedMotion();
  const [tasks, setTasks] = useState(initialTasks);

  // Sync local state when parent passes new tasks (e.g. after store hydration)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );

  const handleToggle = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t,
        ),
      );
      onToggleTask(id);
    },
    [onToggleTask],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setTasks((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id);
        const newIndex = prev.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        onReorder(reordered.map((t) => t.id));
        return reordered;
      });
    },
    [onReorder],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-text-primary">Tasks</h3>
          <span className="text-xs bg-white/[0.06] text-text-secondary rounded-full px-2 py-0.5 font-mono tabular-nums">
            {completedCount}/{tasks.length}
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="No tasks for today"
          description="Capture what's on your mind and we'll help you get started."
          action={{ label: 'Go to Tasks', onClick: () => window.location.href = '/app/tasks' }}
        />
      ) : (
        <motion.div
          className="flex flex-col"
          variants={reducedMotion ? undefined : staggerContainer}
          initial="initial"
          animate="animate"
        >
          <DndContext
            id="today-tasks-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task) => (
                <motion.div key={task.id} variants={reducedMotion ? undefined : staggerItem}>
                  <SortableTask
                    task={task}
                    onToggle={() => handleToggle(task.id)}
                  />
                </motion.div>
              ))}
            </SortableContext>
          </DndContext>
        </motion.div>
      )}
    </div>
  );
}
