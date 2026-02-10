import { create } from 'zustand';
import type { Profile, CheckIn } from '@/types/database';

interface ProfileState {
  profile: Profile | null;
  latestCheckIn: CheckIn | null;
  isAuthenticated: boolean;

  setProfile: (profile: Profile | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setLatestCheckIn: (checkIn: CheckIn | null) => void;
  setAuthenticated: (auth: boolean) => void;
  getLevel: () => number;
  getLevelName: () => string;
  getXPForNextLevel: () => number;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000, 7000, 9000, 12000, 15000, 20000];
const LEVEL_NAMES = [
  'Seedling', 'Sprout', 'Bud', 'Sapling', 'Young Tree',
  'Growing Tree', 'Branching Out', 'Leafy', 'Blossoming', 'Mighty Oak',
  'Deep Roots', 'Canopy', 'Ancient', 'Legendary', 'Ancient Forest',
];

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  latestCheckIn: null,
  isAuthenticated: false,

  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),

  addXP: (amount) =>
    set((state) => {
      if (!state.profile) return {};
      const newXP = state.profile.xp_total + amount;
      let newLevel = state.profile.level;
      while (newLevel < LEVEL_THRESHOLDS.length - 1 && newXP >= LEVEL_THRESHOLDS[newLevel]) {
        newLevel++;
      }
      return { profile: { ...state.profile, xp_total: newXP, level: newLevel } };
    }),

  incrementStreak: () =>
    set((state) => {
      if (!state.profile) return {};
      const newStreak = state.profile.streak_current + 1;
      return {
        profile: {
          ...state.profile,
          streak_current: newStreak,
          streak_best: Math.max(newStreak, state.profile.streak_best),
        },
      };
    }),

  resetStreak: () =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, streak_current: 0 } : null,
    })),

  setLatestCheckIn: (checkIn) => set({ latestCheckIn: checkIn }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),

  getLevel: () => get().profile?.level ?? 1,

  getLevelName: () => {
    const level = get().profile?.level ?? 1;
    return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
  },

  getXPForNextLevel: () => {
    const level = get().profile?.level ?? 1;
    if (level >= LEVEL_THRESHOLDS.length) return 0;
    return LEVEL_THRESHOLDS[level] - (get().profile?.xp_total ?? 0);
  },
}));
