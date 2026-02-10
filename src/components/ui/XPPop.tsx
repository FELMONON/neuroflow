'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface XPPopProps {
  amount: number;
  trigger: boolean;
}

function XPPop({ amount, trigger }: XPPopProps) {
  const [visible, setVisible] = useState(false);
  const prevTriggerRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Detect rising edge only
    if (trigger && !prevTriggerRef.current) {
      setVisible(true);
      // Timer lives in a ref so it won't be killed by effect cleanup
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 1100);
    }
    prevTriggerRef.current = trigger;
  }, [trigger]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <motion.span
      initial={{ opacity: 0, y: 0, scale: 0.4 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [0, -12, -26, -34],
        scale: [0.4, 1.15, 1, 0.85],
      }}
      transition={{
        duration: 1,
        ease: 'easeOut',
        times: [0, 0.15, 0.6, 1],
      }}
      className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-mono font-bold tabular-nums pointer-events-none select-none"
      style={{
        color: 'var(--color-accent-bloom)',
        textShadow: '0 0 10px color-mix(in srgb, var(--color-accent-bloom) 50%, transparent), 0 0 20px color-mix(in srgb, var(--color-accent-bloom) 25%, transparent)',
      }}
      aria-hidden="true"
    >
      +{amount} XP
    </motion.span>
  );
}

export { XPPop };
export type { XPPopProps };
