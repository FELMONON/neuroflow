import type { Task, Habit, HabitCompletion, TimeBlock, CheckIn, EnergyLevel, DopamineCategory } from '@/types/database';

// ─── Seed Tasks ───────────────────────────────────────────────
// Mirrors the MOCK_TASKS from today/page.tsx — used by useTaskStore when not authenticated
export const SEED_TASKS: Task[] = [
  {
    id: 't1', user_id: 'demo', title: 'Fix login redirect bug',
    description: null, status: 'today', priority: 'critical', energy_required: 'high',
    estimated_minutes: 30, actual_minutes: null, interest_level: 3,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 0, tags: [], ai_subtasks: null,
    completed_at: null, xp_value: 25, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 't2', user_id: 'demo', title: 'Review pull request from team',
    description: null, status: 'done', priority: 'high', energy_required: 'medium',
    estimated_minutes: 20, actual_minutes: null, interest_level: 2,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 1, tags: [], ai_subtasks: null,
    completed_at: '2026-01-10T09:00:00Z', xp_value: 15, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 't3', user_id: 'demo', title: 'Write unit tests for auth flow',
    description: null, status: 'done', priority: 'high', energy_required: 'high',
    estimated_minutes: 45, actual_minutes: null, interest_level: 2,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 2, tags: [], ai_subtasks: null,
    completed_at: '2026-01-10T10:00:00Z', xp_value: 25, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 't4', user_id: 'demo', title: 'Design onboarding illustrations',
    description: null, status: 'today', priority: 'medium', energy_required: 'medium',
    estimated_minutes: 60, actual_minutes: null, interest_level: 4,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 3, tags: [], ai_subtasks: null,
    completed_at: null, xp_value: 20, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 't5', user_id: 'demo', title: 'Update environment variables docs',
    description: null, status: 'today', priority: 'low', energy_required: 'low',
    estimated_minutes: 15, actual_minutes: null, interest_level: 1,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 4, tags: [], ai_subtasks: null,
    completed_at: null, xp_value: 10, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 't6', user_id: 'demo', title: 'Brainstorm gamification rewards',
    description: null, status: 'today', priority: 'low', energy_required: 'recharge',
    estimated_minutes: 20, actual_minutes: null, interest_level: 5,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 5, tags: [], ai_subtasks: null,
    completed_at: null, xp_value: 10, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 't7', user_id: 'demo', title: 'Respond to user feedback emails',
    description: null, status: 'done', priority: 'medium', energy_required: 'low',
    estimated_minutes: 10, actual_minutes: null, interest_level: 2,
    due_date: null, due_time: null, scheduled_date: null, scheduled_block: null,
    parent_task_id: null, sort_order: 6, tags: [], ai_subtasks: null,
    completed_at: '2026-01-10T14:00:00Z', xp_value: 10, created_at: '2026-01-10T00:00:00Z', updated_at: '2026-01-10T00:00:00Z',
  },
];

// ─── Seed Habits ──────────────────────────────────────────────
export const SEED_HABITS: Habit[] = [
  {
    id: 'h1', user_id: 'demo', title: 'Take medication',
    description: null, cue: null, routine_type: 'morning', frequency: 'daily',
    custom_days: [], estimated_minutes: 1, sort_order: 0,
    streak_current: 5, streak_best: 12, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h2', user_id: 'demo', title: 'Drink water',
    description: null, cue: null, routine_type: 'morning', frequency: 'daily',
    custom_days: [], estimated_minutes: 1, sort_order: 1,
    streak_current: 3, streak_best: 8, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h3', user_id: 'demo', title: '5 min stretch',
    description: null, cue: null, routine_type: 'morning', frequency: 'daily',
    custom_days: [], estimated_minutes: 5, sort_order: 2,
    streak_current: 2, streak_best: 5, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h4', user_id: 'demo', title: "Review today's plan",
    description: null, cue: null, routine_type: 'morning', frequency: 'daily',
    custom_days: [], estimated_minutes: 3, sort_order: 3,
    streak_current: 0, streak_best: 4, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h5', user_id: 'demo', title: 'Journal gratitude',
    description: null, cue: null, routine_type: 'evening', frequency: 'daily',
    custom_days: [], estimated_minutes: 5, sort_order: 4,
    streak_current: 4, streak_best: 10, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h6', user_id: 'demo', title: "Set out tomorrow's clothes",
    description: null, cue: null, routine_type: 'evening', frequency: 'daily',
    custom_days: [], estimated_minutes: 2, sort_order: 5,
    streak_current: 1, streak_best: 3, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h7', user_id: 'demo', title: 'Move for 15 minutes',
    description: null, cue: null, routine_type: 'anytime', frequency: 'daily',
    custom_days: [], estimated_minutes: 15, sort_order: 6,
    streak_current: 0, streak_best: 6, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'h8', user_id: 'demo', title: 'Read for 10 minutes',
    description: null, cue: null, routine_type: 'anytime', frequency: 'daily',
    custom_days: [], estimated_minutes: 10, sort_order: 7,
    streak_current: 7, streak_best: 14, is_active: true, created_at: '2026-01-01T00:00:00Z',
  },
];

// ─── Seed Time Blocks ─────────────────────────────────────────
export const SEED_TIME_BLOCKS: TimeBlock[] = [
  { start: '08:00', end: '09:30', label: 'Deep Work: API Integration', energy: 'high' },
  { start: '09:30', end: '09:45', label: 'Break', energy: 'recharge' },
  { start: '09:45', end: '11:30', label: 'Code Review & Bug Fixes', energy: 'high' },
  { start: '11:30', end: '13:00', label: 'Lunch & Recharge', energy: 'recharge' },
  { start: '13:00', end: '14:30', label: 'Design & Creative Work', energy: 'medium' },
  { start: '14:30', end: '15:30', label: 'Emails & Admin', energy: 'low' },
  { start: '15:30', end: '17:00', label: 'Brainstorm & Planning', energy: 'medium' },
];

// ─── Seed Focus Task ──────────────────────────────────────────
export const SEED_FOCUS_TASK = {
  id: 't1',
  title: 'Fix login redirect bug',
  estimatedMinutes: 45,
  energyRequired: 'high' as EnergyLevel,
};

// ─── Seed Check-Ins ───────────────────────────────────────────
export const SEED_CHECK_INS: CheckIn[] = [
  {
    id: 'ci1', user_id: 'demo', mood: 4, energy: 3, focus_ability: 4,
    emotions: ['focused', 'calm'], note: null, created_at: '2026-02-10T08:00:00Z',
  },
];

// ─── Seed Habit Completions (today) ───────────────────────────
// Pre-filled so the Today page shows some habits already done
export const SEED_HABIT_COMPLETIONS: HabitCompletion[] = [];

// ─── Seed Dopamine Menu Items ─────────────────────────────────
export const SEED_DOPAMINE_ITEMS: { title: string; category: DopamineCategory; duration_minutes: number; energy: EnergyLevel }[] = [
  { title: 'Listen to a favorite song', category: 'appetizer', duration_minutes: 4, energy: 'low' },
  { title: 'Walk around the block', category: 'appetizer', duration_minutes: 10, energy: 'medium' },
  { title: 'Doodle or sketch something', category: 'entree', duration_minutes: 15, energy: 'medium' },
  { title: 'Watch a short video essay', category: 'entree', duration_minutes: 20, energy: 'low' },
  { title: 'Dance to one song', category: 'side', duration_minutes: 4, energy: 'high' },
  { title: 'Quick tidy of desk', category: 'side', duration_minutes: 5, energy: 'medium' },
  { title: 'Play a favorite game level', category: 'dessert', duration_minutes: 15, energy: 'recharge' },
  { title: 'Make a fancy coffee/tea', category: 'dessert', duration_minutes: 10, energy: 'recharge' },
];

// ─── Seed Unlocked Achievement Slugs ──────────────────────────
export const SEED_UNLOCKED_ACHIEVEMENTS: Record<string, string> = {
  first_focus: '2026-01-15T10:30:00Z',
  brain_dump: '2026-01-18T14:20:00Z',
  early_bird: '2026-01-20T07:45:00Z',
  flow_state: '2026-01-22T16:00:00Z',
  inbox_hero: '2026-01-25T11:30:00Z',
  week_warrior: '2026-01-28T09:00:00Z',
  feeling_it: '2026-02-01T20:15:00Z',
  comeback_kid: '2026-02-05T08:00:00Z',
};
