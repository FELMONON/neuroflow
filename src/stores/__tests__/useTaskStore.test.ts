import { describe, it, expect, beforeEach } from 'vitest';
import type { Task, EnergyLevel, TaskStatus } from '@/types/database';

// Import the store — Zustand works fine without React in tests
import { useTaskStore } from '../useTaskStore';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? '1',
    user_id: 'user-1',
    title: 'Test task',
    description: null,
    status: 'inbox' as TaskStatus,
    priority: 'medium',
    energy_required: 'medium' as EnergyLevel,
    estimated_minutes: null,
    actual_minutes: null,
    interest_level: 3,
    due_date: null,
    due_time: null,
    scheduled_date: null,
    scheduled_block: null,
    parent_task_id: null,
    sort_order: 0,
    tags: [],
    ai_subtasks: null,
    completed_at: null,
    xp_value: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useTaskStore selectors', () => {
  beforeEach(() => {
    useTaskStore.setState({ tasks: [], filter: 'all' });
  });

  describe('getFilteredTasks', () => {
    it('returns all non-archived tasks when filter is "all"', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'inbox' }),
          makeTask({ id: '2', status: 'today' }),
          makeTask({ id: '3', status: 'done' }),
          makeTask({ id: '4', status: 'archived' }),
        ],
        filter: 'all',
      });

      const filtered = useTaskStore.getState().getFilteredTasks();
      expect(filtered.length).toBe(3);
      expect(filtered.map((t) => t.id)).toEqual(['1', '2', '3']);
    });

    it('returns only tasks matching the active filter', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'inbox' }),
          makeTask({ id: '2', status: 'today' }),
          makeTask({ id: '3', status: 'inbox' }),
        ],
        filter: 'inbox',
      });

      const filtered = useTaskStore.getState().getFilteredTasks();
      expect(filtered.length).toBe(2);
      expect(filtered.every((t) => t.status === 'inbox')).toBe(true);
    });

    it('returns empty array when no tasks match filter', () => {
      useTaskStore.setState({
        tasks: [makeTask({ status: 'inbox' })],
        filter: 'done',
      });
      expect(useTaskStore.getState().getFilteredTasks()).toEqual([]);
    });
  });

  describe('getTodayTasks', () => {
    it('returns tasks with status "today" or "in_progress", sorted by sort_order', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'today', sort_order: 2 }),
          makeTask({ id: '2', status: 'in_progress', sort_order: 0 }),
          makeTask({ id: '3', status: 'inbox', sort_order: 1 }),
          makeTask({ id: '4', status: 'today', sort_order: 1 }),
        ],
      });

      const today = useTaskStore.getState().getTodayTasks();
      expect(today.length).toBe(3);
      expect(today.map((t) => t.id)).toEqual(['2', '4', '1']);
    });

    it('returns empty array when no tasks are scheduled for today', () => {
      useTaskStore.setState({
        tasks: [makeTask({ status: 'inbox' }), makeTask({ id: '2', status: 'done' })],
      });
      expect(useTaskStore.getState().getTodayTasks()).toEqual([]);
    });
  });

  describe('getInboxTasks', () => {
    it('returns only inbox tasks', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'inbox' }),
          makeTask({ id: '2', status: 'today' }),
          makeTask({ id: '3', status: 'inbox' }),
        ],
      });

      const inbox = useTaskStore.getState().getInboxTasks();
      expect(inbox.length).toBe(2);
      expect(inbox.every((t) => t.status === 'inbox')).toBe(true);
    });
  });

  describe('getQuickWins', () => {
    it('returns low-energy tasks estimated at 10 minutes or less that are not done/archived', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'inbox', energy_required: 'low', estimated_minutes: 5 }),
          makeTask({ id: '2', status: 'inbox', energy_required: 'low', estimated_minutes: 10 }),
          makeTask({ id: '3', status: 'inbox', energy_required: 'high', estimated_minutes: 5 }),
          makeTask({ id: '4', status: 'inbox', energy_required: 'low', estimated_minutes: 15 }),
          makeTask({ id: '5', status: 'done', energy_required: 'low', estimated_minutes: 5 }),
          makeTask({ id: '6', status: 'archived', energy_required: 'low', estimated_minutes: 5 }),
        ],
      });

      const quickWins = useTaskStore.getState().getQuickWins();
      expect(quickWins.map((t) => t.id)).toEqual(['1', '2']);
    });

    it('excludes tasks with null estimated_minutes (defaults to 999 > 10)', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'inbox', energy_required: 'low', estimated_minutes: null }),
        ],
      });
      expect(useTaskStore.getState().getQuickWins()).toEqual([]);
    });
  });

  describe('getByEnergy', () => {
    it('returns active tasks matching the requested energy level', () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ id: '1', status: 'inbox', energy_required: 'high' }),
          makeTask({ id: '2', status: 'today', energy_required: 'high' }),
          makeTask({ id: '3', status: 'inbox', energy_required: 'low' }),
          makeTask({ id: '4', status: 'done', energy_required: 'high' }),
        ],
      });

      const highEnergy = useTaskStore.getState().getByEnergy('high');
      expect(highEnergy.length).toBe(2);
      expect(highEnergy.map((t) => t.id)).toEqual(['1', '2']);
    });

    it('returns empty array when no tasks match the energy level', () => {
      useTaskStore.setState({
        tasks: [makeTask({ energy_required: 'low' })],
      });
      expect(useTaskStore.getState().getByEnergy('high')).toEqual([]);
    });
  });
});
