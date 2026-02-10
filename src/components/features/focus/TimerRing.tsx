'use client';

interface TimerRingProps {
  timeRemaining: number;
  totalDuration: number;
  isPaused?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function TimerRing({ timeRemaining, totalDuration, isPaused = false }: TimerRingProps) {
  const size = 220;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalDuration > 0 ? timeRemaining / totalDuration : 1;
  const offset = circumference * (1 - progress);
  const timeStr = formatTime(timeRemaining);

  // Visual urgency shift — gentle "almost there" signal
  const isFinishing = timeRemaining <= 60 && timeRemaining > 0;
  const isFinalPush = timeRemaining <= 10 && timeRemaining > 0;

  // Color transitions: purple → warm gold in last minute
  const ringColor = isFinishing ? 'var(--color-accent-sun)' : 'var(--color-accent-flow)';
  const glowColor = isFinishing ? 'var(--color-accent-sun)' : 'var(--color-accent-flow)';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="timer"
      aria-label={`${timeStr} ${isPaused ? 'paused' : 'remaining'}`}
      aria-live="off"
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <filter id="timer-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={glowColor} floodOpacity="0.4" />
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#timer-glow)"
          className={isFinalPush ? 'animate-pulse' : ''}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 2s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-4xl font-semibold tracking-tight tabular-nums transition-colors duration-1000 ${
            isFinishing ? 'text-accent-sun' : 'text-text-primary'
          }`}
        >
          {timeStr}
        </span>
        <span className="text-xs text-text-muted mt-1">
          {isPaused ? 'paused' : isFinishing ? 'almost there' : 'remaining'}
        </span>
      </div>
    </div>
  );
}

export { TimerRing };
export type { TimerRingProps };
