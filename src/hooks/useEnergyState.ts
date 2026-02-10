import { useProfileStore } from '@/stores/useProfileStore';

/**
 * Reads the latest energy check-in from the profile store.
 * Returns current energy/mood state and whether a check-in is needed.
 */
export function useEnergyState() {
  const latestCheckIn = useProfileStore((s) => s.latestCheckIn);

  const currentEnergy = latestCheckIn?.energy ?? null;
  const currentMood = latestCheckIn?.mood ?? null;
  const lastCheckInTime = latestCheckIn?.created_at ?? null;

  // Check-in is "needed" if no check-in today or last one was 4+ hours ago
  const needsCheckIn = (() => {
    if (!lastCheckInTime) return true;
    const lastTime = new Date(lastCheckInTime).getTime();
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;
    return now - lastTime > fourHours;
  })();

  return {
    currentEnergy,
    currentMood,
    lastCheckInTime,
    needsCheckIn,
  };
}
