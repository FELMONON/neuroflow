'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Download, Trash2, LogOut, Save } from 'lucide-react';
import { Card, Input, Button, showToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useProfileStore } from '@/stores/useProfileStore';
import type { ADHDSubtype } from '@/types/database';
import clsx from 'clsx';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

const SUBTYPES = ['Inattentive', 'Hyperactive', 'Combined', 'Not sure'] as const;
const SUBTYPE_MAP: Record<string, ADHDSubtype> = {
  'Inattentive': 'inattentive',
  'Hyperactive': 'hyperactive',
  'Combined': 'combined',
  'Not sure': 'unsure',
};
const SUBTYPE_LABEL_MAP: Record<string, string> = {
  'inattentive': 'Inattentive',
  'hyperactive': 'Hyperactive',
  'combined': 'Combined',
  'unsure': 'Not sure',
};
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT / BST' },
  { value: 'Europe/Berlin', label: 'Central European Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
];
const FONT_SIZES = ['Small', 'Medium', 'Large'] as const;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm text-text-primary">{label}</span>
      <div
        className={clsx(
          'relative w-10 h-5 rounded-full transition-colors duration-150 shrink-0',
          checked ? 'bg-accent-flow' : 'bg-white/[0.10]',
        )}
        onClick={() => onChange(!checked)}
      >
        <div
          className={clsx(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left] duration-150',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </div>
    </label>
  );
}

export default function SettingsPage() {
  const profile = useProfileStore((s) => s.profile);
  const updateProfileStore = useProfileStore((s) => s.updateProfile);

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [subtype, setSubtype] = useState('Combined');
  const [peakStart, setPeakStart] = useState('09:00');
  const [peakEnd, setPeakEnd] = useState('12:00');
  const [dipStart, setDipStart] = useState('14:00');
  const [dipEnd, setDipEnd] = useState('16:00');
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [morningReminder, setMorningReminder] = useState(true);
  const [focusReminder, setFocusReminder] = useState(false);
  const [eveningReminder, setEveningReminder] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState<string>('Medium');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = useMemo(() => createClient(), []);

  // Hydrate local state from profile store
  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? '');
    setTimezone(profile.timezone ?? 'America/New_York');
    setSubtype(SUBTYPE_LABEL_MAP[profile.adhd_subtype ?? 'combined'] ?? 'Combined');
    if (profile.energy_pattern) {
      setPeakStart(profile.energy_pattern.peak_start ?? '09:00');
      setPeakEnd(profile.energy_pattern.peak_end ?? '12:00');
      setDipStart(profile.energy_pattern.dip_start ?? '14:00');
      setDipEnd(profile.energy_pattern.dip_end ?? '16:00');
    }
    setWorkDuration(profile.preferred_work_duration ?? 25);
    setBreakDuration(profile.preferred_break_duration ?? 5);
    const settings = (profile.settings ?? {}) as Record<string, unknown>;
    setMorningReminder(settings.morning_reminder !== false);
    setFocusReminder(settings.focus_reminder === true);
    setEveningReminder(settings.evening_reminder !== false);
    setReducedMotion(settings.reduced_motion === true);
    setFontSize((settings.font_size as string) ?? 'Medium');
  }, [profile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');

    const updates = {
      display_name: name.trim() || null,
      timezone,
      adhd_subtype: SUBTYPE_MAP[subtype] ?? ('combined' as ADHDSubtype),
      energy_pattern: {
        peak_start: peakStart,
        peak_end: peakEnd,
        dip_start: dipStart,
        dip_end: dipEnd,
      },
      preferred_work_duration: workDuration,
      preferred_break_duration: breakDuration,
      settings: {
        morning_reminder: morningReminder,
        focus_reminder: focusReminder,
        evening_reminder: eveningReminder,
        reduced_motion: reducedMotion,
        font_size: fontSize,
      },
      updated_at: new Date().toISOString(),
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast({ message: 'You must be signed in to save settings.', variant: 'error' });
      setSaving(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    setSaving(false);

    if (dbError) {
      setError('Could not save settings. Please try again.');
      showToast({ message: 'Could not save settings. Try again?', variant: 'error' });
      return;
    }

    updateProfileStore(updates);
    showToast({ message: 'Settings saved!', variant: 'success' });
  }, [
    name, timezone, subtype, peakStart, peakEnd, dipStart, dipEnd,
    workDuration, breakDuration, morningReminder, focusReminder,
    eveningReminder, reducedMotion, fontSize, supabase, updateProfileStore,
  ]);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, [supabase]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (res.ok) {
        await supabase.auth.signOut();
        window.location.href = '/login';
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Could not delete account. Try again?');
        setDeleting(false);
      }
    } catch {
      setError('Network error. Please check your connection.');
      setDeleting(false);
    }
  }, [supabase]);

  const handleExport = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast({ message: 'You must be signed in to export data.', variant: 'error' });
        return;
      }

      const [tasks, habits, sessions, checkIns, achievements] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id),
        supabase.from('check_ins').select('*').eq('user_id', user.id),
        supabase.from('user_achievements').select('*').eq('user_id', user.id),
      ]);

      const data = {
        exportedAt: new Date().toISOString(),
        profile: profile ?? null,
        tasks: tasks.data ?? [],
        habits: habits.data ?? [],
        focusSessions: sessions.data ?? [],
        checkIns: checkIns.data ?? [],
        achievements: achievements.data ?? [],
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neuroflow-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({ message: 'Data exported!', variant: 'success' });
    } catch {
      showToast({ message: 'Failed to export data.', variant: 'error' });
    }
  }, [supabase, profile]);

  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6"
      variants={prefersReducedMotion ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>

      {/* Profile */}
      <Card header={<h2 className="text-sm font-semibold text-text-primary">Profile</h2>}>
        <div className="flex flex-col gap-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Timezone</label>
            <div className="relative">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 rounded-xl bg-bg-tertiary border border-white/[0.08] text-text-primary px-3 pr-8 appearance-none text-sm focus:outline-none focus:ring-1 focus:ring-accent-flow/40 focus:border-accent-flow/50 cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* ADHD */}
      <Card header={<h2 className="text-sm font-semibold text-text-primary">ADHD</h2>}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Subtype</label>
            <div className="flex gap-2 flex-wrap">
              {SUBTYPES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubtype(s)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer',
                    subtype === s
                      ? 'bg-accent-flow/10 text-accent-flow'
                      : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">Peak hours</span>
              <div className="flex items-center gap-2">
                <input type="time" value={peakStart} onChange={(e) => setPeakStart(e.target.value)} className="bg-bg-tertiary border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-flow/40 focus:border-accent-flow/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50" />
                <span className="text-text-muted text-xs">to</span>
                <input type="time" value={peakEnd} onChange={(e) => setPeakEnd(e.target.value)} className="bg-bg-tertiary border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-flow/40 focus:border-accent-flow/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-text-muted">Dip hours</span>
              <div className="flex items-center gap-2">
                <input type="time" value={dipStart} onChange={(e) => setDipStart(e.target.value)} className="bg-bg-tertiary border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-flow/40 focus:border-accent-flow/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50" />
                <span className="text-text-muted text-xs">to</span>
                <input type="time" value={dipEnd} onChange={(e) => setDipEnd(e.target.value)} className="bg-bg-tertiary border border-white/[0.08] rounded-lg px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-flow/40 focus:border-accent-flow/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Work duration</span>
              <span className="text-sm text-text-muted font-mono tabular-nums">{workDuration} min</span>
            </div>
            <input type="range" min={10} max={90} step={5} value={workDuration} onChange={(e) => setWorkDuration(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.10] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-flow [&::-webkit-slider-thumb]:cursor-pointer" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Break duration</span>
              <span className="text-sm text-text-muted font-mono tabular-nums">{breakDuration} min</span>
            </div>
            <input type="range" min={5} max={30} step={5} value={breakDuration} onChange={(e) => setBreakDuration(Number(e.target.value))} className="w-full h-1.5 bg-white/[0.10] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-flow [&::-webkit-slider-thumb]:cursor-pointer" />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card header={<h2 className="text-sm font-semibold text-text-primary">Notifications</h2>}>
        <div className="flex flex-col">
          <Toggle checked={morningReminder} onChange={setMorningReminder} label="Morning planning reminder" />
          <Toggle checked={focusReminder} onChange={setFocusReminder} label="Focus session reminder" />
          <Toggle checked={eveningReminder} onChange={setEveningReminder} label="Evening check-in" />
        </div>
      </Card>

      {/* Accessibility */}
      <Card header={<h2 className="text-sm font-semibold text-text-primary">Accessibility</h2>}>
        <div className="flex flex-col gap-3">
          <Toggle checked={reducedMotion} onChange={setReducedMotion} label="Reduced motion" />
          <div>
            <span className="text-sm text-text-primary block mb-2">Font size</span>
            <div className="flex gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer',
                    fontSize === size
                      ? 'bg-accent-flow/10 text-accent-flow'
                      : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08]',
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Save */}
      <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>
        Save settings
      </Button>
      {error && <p className="text-xs text-accent-spark -mt-4">{error}</p>}

      {/* Account */}
      <Card header={<h2 className="text-sm font-semibold text-text-primary">Account</h2>}>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" icon={<LogOut size={16} />} loading={signingOut} onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </Card>

      {/* Data */}
      <Card header={<h2 className="text-sm font-semibold text-text-primary">Data</h2>}>
        <div className="flex flex-col gap-3">
          <Button variant="secondary" icon={<Download size={16} />} onClick={handleExport}>
            Export data
          </Button>
          {!showDeleteConfirm ? (
            <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>
              Delete account
            </Button>
          ) : (
            <div className="p-4 rounded-xl border border-accent-spark/20 bg-accent-spark/5">
              <p className="text-sm text-text-primary mb-1">Are you sure?</p>
              <p className="text-xs text-text-muted mb-3">This will permanently delete your account and all data. This cannot be undone.</p>
              {error && <p className="text-xs text-accent-spark mb-2">{error}</p>}
              <div className="flex gap-2">
                <Button variant="danger" size="sm" loading={deleting} onClick={handleDeleteAccount}>
                  Yes, delete my account
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setShowDeleteConfirm(false); setError(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
