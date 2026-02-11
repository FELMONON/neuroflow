import type { AchievementCategory } from '@/types/database';

// Re-export level utilities from the single source of truth
export { getLevelFromXP as calculateLevel, xpForNextLevel, xpProgressInLevel } from '@/lib/levels';

export interface AchievementDefinition {
  slug: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: AchievementCategory;
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  first_focus: {
    slug: 'first_focus',
    title: 'First Focus',
    description: 'Complete your first focus session',
    icon: 'zap',
    xp_reward: 50,
    category: 'focus',
  },
  brain_dump: {
    slug: 'brain_dump',
    title: 'Brain Dump',
    description: 'Capture 10 parking lot items in one session',
    icon: 'brain',
    xp_reward: 75,
    category: 'focus',
  },
  early_bird: {
    slug: 'early_bird',
    title: 'Early Bird',
    description: 'Complete a task before 8 AM',
    icon: 'sunrise',
    xp_reward: 50,
    category: 'tasks',
  },
  night_owl: {
    slug: 'night_owl',
    title: 'Night Owl',
    description: 'Complete a focus session after 10 PM',
    icon: 'moon',
    xp_reward: 50,
    category: 'focus',
  },
  comeback_kid: {
    slug: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Return after 7+ days away',
    icon: 'rotate-ccw',
    xp_reward: 100,
    category: 'streak',
  },
  flow_state: {
    slug: 'flow_state',
    title: 'Flow State',
    description: 'Rate 5/5 focus quality',
    icon: 'flame',
    xp_reward: 75,
    category: 'focus',
  },
  body_buddy: {
    slug: 'body_buddy',
    title: 'Body Buddy',
    description: 'Complete 10 body doubling sessions',
    icon: 'users',
    xp_reward: 100,
    category: 'social',
  },
  inbox_hero: {
    slug: 'inbox_hero',
    title: 'Inbox Hero',
    description: 'Process all inbox items',
    icon: 'inbox',
    xp_reward: 75,
    category: 'tasks',
  },
  habit_master: {
    slug: 'habit_master',
    title: 'Habit Master',
    description: '30-day resilience streak',
    icon: 'award',
    xp_reward: 200,
    category: 'habits',
  },
  time_detective: {
    slug: 'time_detective',
    title: 'Time Detective',
    description: 'Track actual time for 20 tasks',
    icon: 'clock',
    xp_reward: 100,
    category: 'tasks',
  },
  feeling_it: {
    slug: 'feeling_it',
    title: 'Feeling It',
    description: 'Complete 30 emotional check-ins',
    icon: 'heart',
    xp_reward: 100,
    category: 'emotional',
  },
  task_crusher: {
    slug: 'task_crusher',
    title: 'Task Crusher',
    description: 'Complete 100 tasks',
    icon: 'check-circle',
    xp_reward: 150,
    category: 'tasks',
  },
  week_warrior: {
    slug: 'week_warrior',
    title: 'Week Warrior',
    description: '7-day streak',
    icon: 'shield',
    xp_reward: 100,
    category: 'streak',
  },
  month_master: {
    slug: 'month_master',
    title: 'Month Master',
    description: '30-day streak',
    icon: 'crown',
    xp_reward: 300,
    category: 'streak',
  },
  centurion: {
    slug: 'centurion',
    title: 'Centurion',
    description: 'Reach level 10',
    icon: 'star',
    xp_reward: 500,
    category: 'streak',
  },
};

export function getAchievementBySlug(slug: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS[slug];
}

export function getAchievementsByCategory(category: AchievementCategory): AchievementDefinition[] {
  return Object.values(ACHIEVEMENTS).filter((a) => a.category === category);
}

export function getAllAchievements(): AchievementDefinition[] {
  return Object.values(ACHIEVEMENTS);
}

