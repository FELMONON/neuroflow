'use client';

import { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function getDateStr() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

interface GreetingHeaderProps {
  streak: number;
}

export function GreetingHeader({ streak }: GreetingHeaderProps) {
  // SSR-safe: render static text first, hydrate time-dependent values after mount
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      requestAnimationFrame(() => setMounted(true));
    }
  }, []);

  const greeting = mounted ? getGreeting() : 'Welcome back';
  const dateStr = mounted ? getDateStr() : '\u00A0'; // non-breaking space preserves layout

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary tracking-tight">{greeting}</h1>
      <div className="flex items-center gap-4 mt-1">
        <p className="text-sm text-text-secondary">{dateStr}</p>
        {streak > 0 && (
          <div className="inline-flex items-center gap-1 text-sm text-accent-grow">
            <Flame size={14} className="text-accent-grow" />
            <span className="font-medium font-mono tabular-nums">{streak} day streak</span>
          </div>
        )}
      </div>
    </div>
  );
}
