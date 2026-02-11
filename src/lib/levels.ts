/**
 * Single source of truth for level calculations.
 *
 * LEVEL_THRESHOLDS[i] is the cumulative XP required to reach level (i + 1).
 * Index 0 → level 1 starts at 0 XP, index 1 → level 2 starts at 100 XP, etc.
 */
export const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000, 7000, 9000, 12000,
  15000, 20000,
];

export const LEVEL_NAMES = [
  'Seedling', 'Sprout', 'Bud', 'Sapling', 'Young Tree',
  'Growing Tree', 'Branching Out', 'Leafy', 'Blossoming', 'Mighty Oak',
  'Deep Roots', 'Canopy', 'Ancient', 'Legendary', 'Ancient Forest',
];

/** Returns the level (1-based) for a given total XP. */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (level < LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS[level]) {
    level++;
  }
  return level;
}

/** XP required to go from `currentLevel` to the next level. */
export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) return 0;
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] ?? currentThreshold;
  return nextThreshold - currentThreshold;
}

/** How much XP the user has earned *within* their current level. */
export function xpProgressInLevel(xp: number, level: number): number {
  const levelStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  return xp - levelStart;
}

/** Name for a given level number (1-based). */
export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
}
