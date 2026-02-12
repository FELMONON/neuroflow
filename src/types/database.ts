export type EnergyLevel = 'high' | 'medium' | 'low' | 'recharge';
export type TaskStatus = 'inbox' | 'today' | 'scheduled' | 'in_progress' | 'done' | 'archived';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type ADHDSubtype = 'inattentive' | 'hyperactive' | 'combined' | 'unsure';
export type SessionType = 'focus' | 'break' | 'body_double';
export type RoomType = 'open' | 'invite_only';
export type DopamineCategory = 'appetizer' | 'entree' | 'side' | 'dessert';
export type RoutineType = 'morning' | 'evening' | 'anytime' | 'custom';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type AchievementCategory = 'streak' | 'focus' | 'tasks' | 'habits' | 'social' | 'emotional';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  onboarding_completed: boolean;
  adhd_subtype: ADHDSubtype | null;
  energy_pattern: {
    peak_start: string;
    peak_end: string;
    dip_start: string;
    dip_end: string;
  };
  preferred_work_duration: number;
  preferred_break_duration: number;
  streak_current: number;
  streak_best: number;
  xp_total: number;
  level: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  energy_required: EnergyLevel;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  interest_level: number;
  due_date: string | null;
  due_time: string | null;
  scheduled_date: string | null;
  scheduled_block: string | null;
  parent_task_id: string | null;
  sort_order: number;
  tags: string[];
  ai_subtasks: Subtask[] | null;
  completed_at: string | null;
  xp_value: number;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  title: string;
  estimated_minutes: number;
  energy_required: EnergyLevel;
  completed?: boolean;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string | null;
  session_type: SessionType;
  planned_duration: number;
  actual_duration: number | null;
  focus_quality: number | null;
  distractions_count: number;
  notes: string | null;
  soundscape: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  energy_forecast: EnergyLevel | 'unknown';
  main_focus: string | null;
  time_blocks: TimeBlock[];
  morning_intention: string | null;
  evening_reflection: string | null;
  mood_morning: number | null;
  mood_evening: number | null;
  wins: string[];
  struggles: string[];
  created_at: string;
  updated_at: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  task_id?: string;
  label: string;
  energy: EnergyLevel;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cue: string | null;
  routine_type: RoutineType;
  frequency: HabitFrequency;
  custom_days: number[];
  estimated_minutes: number;
  sort_order: number;
  streak_current: number;
  streak_best: number;
  is_active: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
  notes: string | null;
}

export interface ParkingLotItem {
  id: string;
  user_id: string;
  content: string;
  captured_during_session_id: string | null;
  processed: boolean;
  converted_to_task_id: string | null;
  created_at: string;
}

export interface BodyDoubleRoom {
  id: string;
  host_id: string;
  title: string;
  room_type: RoomType;
  max_participants: number;
  current_focus: string | null;
  soundscape: string | null;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  current_task: string | null;
  joined_at: string;
  left_at: string | null;
}

export interface DopamineMenuItem {
  id: string;
  user_id: string;
  title: string;
  category: DopamineCategory;
  duration_minutes: number | null;
  notes: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  mood: number | null;
  energy: number | null;
  focus_ability: number | null;
  emotions: string[];
  note: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  category: AchievementCategory;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

// Helper: Supabase v2.95 requires inline object types for Insert/Update,
// Partial<Interface> resolves to `never` in the typed client's generic resolution.
type TableDef<
  Row,
  RequiredInsert extends keyof Row = never,
> = {
  Row: { [K in keyof Row]: Row[K] };
  Insert: { [K in RequiredInsert]: Row[K] } & { [K in Exclude<keyof Row, RequiredInsert>]?: Row[K] };
  Update: { [K in keyof Row]?: Row[K] };
  Relationships: [];
};

// Supabase Database type helper -- matches GenericSchema from @supabase/supabase-js
export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, 'id'>;
      tasks: TableDef<Task, 'user_id' | 'title'>;
      focus_sessions: TableDef<FocusSession, 'user_id' | 'planned_duration'>;
      daily_plans: TableDef<DailyPlan, 'user_id' | 'plan_date'>;
      habits: TableDef<Habit, 'user_id' | 'title'>;
      habit_completions: TableDef<HabitCompletion, 'habit_id' | 'user_id' | 'completed_date'>;
      parking_lot: TableDef<ParkingLotItem, 'user_id' | 'content'>;
      body_double_rooms: TableDef<BodyDoubleRoom, 'host_id'>;
      room_participants: TableDef<RoomParticipant, 'room_id' | 'user_id'>;
      dopamine_menu: TableDef<DopamineMenuItem, 'user_id' | 'title'>;
      check_ins: TableDef<CheckIn, 'user_id'>;
      achievements: TableDef<Achievement, 'slug' | 'title'>;
      user_achievements: TableDef<UserAchievement, 'user_id' | 'achievement_id'>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string;
          p_max: number;
          p_window_ms: number;
        };
        Returns: {
          allowed: boolean;
          remaining: number;
          retry_after_ms: number;
        }[];
      };
      unlock_achievements_and_award_xp: {
        Args: {
          p_user_id: string;
          p_achievement_ids: string[];
        };
        Returns: {
          achievement_id: string;
          xp_awarded: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
