import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { FocusSession, ParkingLotItem } from '@/types/database';

// Lazy singleton — created once on first mutation that needs Supabase
let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isPersistedId(id: string): boolean {
  return UUID_RE.test(id);
}

type SessionStatus = 'idle' | 'setup' | 'running' | 'paused' | 'break' | 'complete';

interface SessionState {
  currentSession: FocusSession | null;
  lastCompletedSession: FocusSession | null;
  status: SessionStatus;
  timeRemaining: number;
  parkingLot: ParkingLotItem[];
  soundscape: string;
  volume: number;

  startSession: (session: FocusSession) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (quality?: number, notes?: string) => void;
  setTimeRemaining: (seconds: number) => void;
  extendSession: (minutes: number) => void;
  addToParkingLot: (item: ParkingLotItem) => void;
  removeParkingLotItem: (index: number) => void;
  setSoundscape: (soundscape: string) => void;
  setVolume: (volume: number) => void;
  setStatus: (status: SessionStatus) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  lastCompletedSession: null,
  status: 'idle',
  timeRemaining: 0,
  parkingLot: [],
  soundscape: 'brown_noise',
  volume: 0.5,

  startSession: (session) => {
    set({
      currentSession: session,
      status: 'running',
      timeRemaining: session.planned_duration * 60,
      parkingLot: [],
    });
    // Persist the new session row to Supabase
    if (isPersistedId(session.id)) {
      const supabase = getSupabase();
      supabase
        .from('focus_sessions')
        .insert(session)
        .then(({ error }) => {
          if (error) console.error('[SessionStore] Failed to start session:', error.message);
        });
    }
  },

  pauseSession: () => set({ status: 'paused' }),

  resumeSession: () => set({ status: 'running' }),

  endSession: (quality, notes) => {
    const session = get().currentSession;
    if (!session) {
      set({ status: 'complete', timeRemaining: 0 });
      return;
    }

    const endedAt = new Date().toISOString();
    const startedAt = new Date(session.started_at);
    const actualMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);

    const completedSession: FocusSession = {
      ...session,
      actual_duration: actualMinutes,
      focus_quality: quality ?? null,
      notes: notes ?? session.notes,
      ended_at: endedAt,
    };

    // Persist to Supabase — update existing row if persisted, insert otherwise
    if (isPersistedId(session.id)) {
      const supabase = getSupabase();
      supabase
        .from('focus_sessions')
        .update({
          actual_duration: actualMinutes,
          focus_quality: quality ?? null,
          notes: notes ?? session.notes,
          ended_at: endedAt,
        })
        .eq('id', session.id)
        .then(({ error }) => {
          if (error) console.error('[SessionStore] Failed to save session:', error.message);
        });

      // Persist parking lot items
      const parkingLot = get().parkingLot;
      if (parkingLot.length > 0) {
        supabase
          .from('parking_lot')
          .insert(parkingLot.map((item) => ({
            ...item,
            captured_during_session_id: session.id,
          })))
          .then(({ error }) => {
            if (error) console.error('[SessionStore] Failed to save parking lot:', error.message);
          });
      }
    }

    set({
      lastCompletedSession: completedSession,
      currentSession: null,
      status: 'complete',
      timeRemaining: 0,
    });
  },

  setTimeRemaining: (seconds) => set({ timeRemaining: Math.max(0, seconds) }),

  extendSession: (minutes) =>
    set((state) => ({ timeRemaining: state.timeRemaining + minutes * 60 })),

  addToParkingLot: (item) =>
    set((state) => ({ parkingLot: [...state.parkingLot, item] })),

  removeParkingLotItem: (index) =>
    set((state) => ({ parkingLot: state.parkingLot.filter((_, i) => i !== index) })),

  setSoundscape: (soundscape) => set({ soundscape }),
  setVolume: (volume) => set({ volume }),
  setStatus: (status) => set({ status }),
}));
