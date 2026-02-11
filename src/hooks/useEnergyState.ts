import { useState, useEffect, useRef } from 'react';
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

  // Check-in is "needed" if no check-in today or last one was 4+ hours ago.
  // Computed in an effect to avoid calling Date.now() during render.
  const [needsCheckIn, setNeedsCheckIn] = useState(true);
  const lastCheckInTimeRef = useRef(lastCheckInTime);

  useEffect(() => {
    lastCheckInTimeRef.current = lastCheckInTime;
    const id = requestAnimationFrame(() => {
      if (!lastCheckInTime) {
        setNeedsCheckIn(true);
        return;
      }
      const lastTime = new Date(lastCheckInTime).getTime();
      const fourHours = 4 * 60 * 60 * 1000;
      setNeedsCheckIn(Date.now() - lastTime > fourHours);
    });
    return () => cancelAnimationFrame(id);
  }, [lastCheckInTime]);

  return {
    currentEnergy,
    currentMood,
    lastCheckInTime,
    needsCheckIn,
  };
}
