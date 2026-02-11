import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { LEVEL_THRESHOLDS, getLevelFromXP, getLevelName as getLevelNameFromLib } from '@/lib/levels';
import type { Profile, CheckIn } from '@/types/database';

// Lazy singleton — created once on first mutation that needs Supabase
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

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

function syncProfileToSupabase(profileId: string, updates: Partial<Profile>) {
  const supabase = getSupabase();
  supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .then(({ error }) => {
      if (error) console.error('[useProfileStore] sync error:', error.message);
    });
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  latestCheckIn: null,
  isAuthenticated: false,

  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),

  updateProfile: (updates) => {
    const prev = get().profile;
    if (!prev) return;
    set({ profile: { ...prev, ...updates } });
    syncProfileToSupabase(prev.id, updates);
  },

  addXP: (amount) => {
    const prev = get().profile;
    if (!prev) return;
    const newXP = prev.xp_total + amount;
    const newLevel = getLevelFromXP(newXP);
    set({ profile: { ...prev, xp_total: newXP, level: newLevel } });
    syncProfileToSupabase(prev.id, { xp_total: newXP, level: newLevel });
  },

  incrementStreak: () => {
    const prev = get().profile;
    if (!prev) return;
    const newStreak = prev.streak_current + 1;
    const updates = {
      streak_current: newStreak,
      streak_best: Math.max(newStreak, prev.streak_best),
    };
    set({ profile: { ...prev, ...updates } });
    syncProfileToSupabase(prev.id, updates);
  },

  resetStreak: () => {
    const prev = get().profile;
    if (!prev) return;
    set({ profile: { ...prev, streak_current: 0 } });
    syncProfileToSupabase(prev.id, { streak_current: 0 });
  },

  setLatestCheckIn: (checkIn) => set({ latestCheckIn: checkIn }),
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),

  getLevel: () => get().profile?.level ?? 1,

  getLevelName: () => {
    const level = get().profile?.level ?? 1;
    return getLevelNameFromLib(level);
  },

  getXPForNextLevel: () => {
    const level = get().profile?.level ?? 1;
    if (level >= LEVEL_THRESHOLDS.length) return 0;
    return LEVEL_THRESHOLDS[level] - (get().profile?.xp_total ?? 0);
  },
}));
