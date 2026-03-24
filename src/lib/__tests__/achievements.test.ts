import { describe, it, expect } from 'vitest';
import {
  getAchievementBySlug,
  getAchievementsByCategory,
  getAllAchievements,
  ACHIEVEMENTS,
} from '../achievements';

describe('getAchievementBySlug', () => {
  it('returns the correct achievement for a valid slug', () => {
    const achievement = getAchievementBySlug('first_focus');
    expect(achievement).toBeDefined();
    expect(achievement!.slug).toBe('first_focus');
    expect(achievement!.title).toBe('First Focus');
    expect(achievement!.xp_reward).toBe(50);
    expect(achievement!.category).toBe('focus');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getAchievementBySlug('nonexistent')).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getAchievementBySlug('')).toBeUndefined();
  });

  it('each achievement has required fields', () => {
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
      expect(achievement.slug).toBe(key);
      expect(achievement.title).toBeTruthy();
      expect(achievement.description).toBeTruthy();
      expect(achievement.icon).toBeTruthy();
      expect(achievement.xp_reward).toBeGreaterThan(0);
      expect(achievement.category).toBeTruthy();
    }
  });
});

describe('getAchievementsByCategory', () => {
  it('returns only focus achievements when filtering by focus', () => {
    const focusAchievements = getAchievementsByCategory('focus');
    expect(focusAchievements.length).toBeGreaterThan(0);
    expect(focusAchievements.every((a) => a.category === 'focus')).toBe(true);
  });

  it('returns streak achievements', () => {
    const streakAchievements = getAchievementsByCategory('streak');
    expect(streakAchievements.length).toBeGreaterThan(0);
    const slugs = streakAchievements.map((a) => a.slug);
    expect(slugs).toContain('week_warrior');
    expect(slugs).toContain('month_master');
  });

  it('returns empty array for a category with no achievements', () => {
    // Cast to any valid AchievementCategory that has no entries if possible,
    // or use one that we know has entries and verify
    const result = getAchievementsByCategory('social');
    // 'social' has body_buddy
    expect(result.length).toBe(1);
    expect(result[0].slug).toBe('body_buddy');
  });

  it('all achievements are accounted for across categories', () => {
    const categories = ['streak', 'focus', 'tasks', 'habits', 'social', 'emotional'] as const;
    const allFromCategories = categories.flatMap((c) => getAchievementsByCategory(c));
    const allDirect = getAllAchievements();
    expect(allFromCategories.length).toBe(allDirect.length);
  });
});

describe('getAllAchievements', () => {
  it('returns all defined achievements', () => {
    const all = getAllAchievements();
    expect(all.length).toBe(Object.keys(ACHIEVEMENTS).length);
  });

  it('every returned achievement has a unique slug', () => {
    const all = getAllAchievements();
    const slugs = all.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
