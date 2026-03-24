import { describe, it, expect } from 'vitest';
import {
  getLevelFromXP,
  xpForNextLevel,
  xpProgressInLevel,
  getLevelName,
  LEVEL_THRESHOLDS,
  LEVEL_NAMES,
} from '../levels';

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('returns level 1 for 99 XP (just below level 2 threshold)', () => {
    expect(getLevelFromXP(99)).toBe(1);
  });

  it('returns level 2 at exactly 100 XP', () => {
    expect(getLevelFromXP(100)).toBe(2);
  });

  it('returns correct levels at each threshold boundary', () => {
    // At each threshold, the user should have reached that level
    LEVEL_THRESHOLDS.forEach((threshold, index) => {
      if (index === 0) return; // level 1 starts at 0
      expect(getLevelFromXP(threshold)).toBe(index + 1);
    });
  });

  it('returns max level for XP beyond all thresholds', () => {
    expect(getLevelFromXP(999999)).toBe(LEVEL_THRESHOLDS.length);
  });

  it('returns level 1 for negative XP', () => {
    expect(getLevelFromXP(-100)).toBe(1);
  });
});

describe('xpForNextLevel', () => {
  it('returns 100 XP needed from level 1 to level 2', () => {
    expect(xpForNextLevel(1)).toBe(100);
  });

  it('returns 200 XP needed from level 2 to level 3', () => {
    // level 2 starts at 100, level 3 at 300 → 200
    expect(xpForNextLevel(2)).toBe(200);
  });

  it('returns 0 when already at max level', () => {
    expect(xpForNextLevel(LEVEL_THRESHOLDS.length)).toBe(0);
  });

  it('returns 0 for levels beyond max', () => {
    expect(xpForNextLevel(LEVEL_THRESHOLDS.length + 5)).toBe(0);
  });
});

describe('xpProgressInLevel', () => {
  it('returns 0 progress at the start of level 1', () => {
    expect(xpProgressInLevel(0, 1)).toBe(0);
  });

  it('returns correct progress within level 1', () => {
    expect(xpProgressInLevel(50, 1)).toBe(50);
  });

  it('returns 0 progress at the start of level 2', () => {
    expect(xpProgressInLevel(100, 2)).toBe(0);
  });

  it('returns correct progress within level 3', () => {
    // level 3 starts at 300
    expect(xpProgressInLevel(450, 3)).toBe(150);
  });
});

describe('getLevelName', () => {
  it('returns "Seedling" for level 1', () => {
    expect(getLevelName(1)).toBe('Seedling');
  });

  it('returns "Mighty Oak" for level 10', () => {
    expect(getLevelName(10)).toBe('Mighty Oak');
  });

  it('returns last name for levels beyond the names array', () => {
    const lastNameIndex = LEVEL_NAMES.length - 1;
    expect(getLevelName(100)).toBe(LEVEL_NAMES[lastNameIndex]);
  });

  it('maps every defined level to a unique name', () => {
    const names = LEVEL_NAMES.map((_, i) => getLevelName(i + 1));
    expect(names).toEqual(LEVEL_NAMES);
  });
});
