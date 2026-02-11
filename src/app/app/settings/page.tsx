'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Save } from 'lucide-react';
import { Button, showToast } from '@/components/ui';
import { ProfileSection } from '@/components/features/settings/ProfileSection';
import { ADHDSection } from '@/components/features/settings/ADHDSection';
import { NotificationsSection } from '@/components/features/settings/NotificationsSection';
import { AccessibilitySection } from '@/components/features/settings/AccessibilitySection';
import { AccountDataSection } from '@/components/features/settings/AccountDataSection';
import { createClient } from '@/lib/supabase/client';
import { useProfileStore } from '@/stores/useProfileStore';
import type { ADHDSubtype } from '@/types/database';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const pageTransition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const };

const SUBTYPE_MAP: Record<string, ADHDSubtype> = {
  'Inattentive': 'inattentive', 'Hyperactive': 'hyperactive',
  'Combined': 'combined', 'Not sure': 'unsure',
};
const SUBTYPE_LABEL_MAP: Record<string, string> = {
  'inattentive': 'Inattentive', 'hyperactive': 'Hyperactive',
  'combined': 'Combined', 'unsure': 'Not sure',
};

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = useMemo(() => createClient(), []);
  const prevProfileIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    // Only sync from profile when the profile identity changes (initial load or user switch)
    if (prevProfileIdRef.current === profile.id) return;
    prevProfileIdRef.current = profile.id;

    const syncState = () => {
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
    };
    // Defer to next microtask to avoid synchronous setState in effect
    const id = requestAnimationFrame(syncState);
    return () => cancelAnimationFrame(id);
  }, [profile]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError('');
    const updates = {
      display_name: name.trim() || null,
      timezone,
      adhd_subtype: SUBTYPE_MAP[subtype] ?? ('combined' as ADHDSubtype),
      energy_pattern: { peak_start: peakStart, peak_end: peakEnd, dip_start: dipStart, dip_end: dipEnd },
      preferred_work_duration: workDuration,
      preferred_break_duration: breakDuration,
      settings: {
        morning_reminder: morningReminder, focus_reminder: focusReminder,
        evening_reminder: eveningReminder, reduced_motion: reducedMotion, font_size: fontSize,
      },
      updated_at: new Date().toISOString(),
    };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast({ message: 'You must be signed in to save settings.', variant: 'error' });
      setSaving(false);
      return;
    }
    const { error: dbError } = await supabase.from('profiles').update(updates).eq('id', user.id);
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

  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6"
      variants={prefersReducedMotion ? undefined : pageVariants}
      initial="initial" animate="animate" exit="exit" transition={pageTransition}
    >
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
      <ProfileSection name={name} timezone={timezone} onNameChange={setName} onTimezoneChange={setTimezone} />
      <ADHDSection
        subtype={subtype} peakStart={peakStart} peakEnd={peakEnd} dipStart={dipStart} dipEnd={dipEnd}
        workDuration={workDuration} breakDuration={breakDuration}
        onSubtypeChange={setSubtype} onPeakStartChange={setPeakStart} onPeakEndChange={setPeakEnd}
        onDipStartChange={setDipStart} onDipEndChange={setDipEnd}
        onWorkDurationChange={setWorkDuration} onBreakDurationChange={setBreakDuration}
      />
      <NotificationsSection
        morningReminder={morningReminder} focusReminder={focusReminder} eveningReminder={eveningReminder}
        onMorningChange={setMorningReminder} onFocusChange={setFocusReminder} onEveningChange={setEveningReminder}
      />
      <AccessibilitySection
        reducedMotion={reducedMotion} fontSize={fontSize}
        onReducedMotionChange={setReducedMotion} onFontSizeChange={setFontSize}
      />
      <Button icon={<Save size={16} />} loading={saving} onClick={handleSave}>Save settings</Button>
      {error && <p className="text-xs text-accent-spark -mt-4">{error}</p>}
      <AccountDataSection profile={profile} />
    </motion.div>
  );
}
