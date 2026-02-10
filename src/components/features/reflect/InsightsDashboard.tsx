'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui';

interface DayData {
  date: string;
  mood: number;
  energy: number;
  focus: number;
}

interface InsightsDashboardProps {
  data: DayData[];
  className?: string;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function LineChart({ data, label }: { data: number[]; label: string }) {
  const width = 280;
  const height = 100;
  const pad = { top: 10, bottom: 20, left: 16, right: 16 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const divisor = data.length <= 1 ? 1 : data.length - 1;
  const points = data.map((val, idx) => ({
    x: pad.left + (idx / divisor) * cw,
    y: pad.top + ch - ((val - 1) / 4) * ch,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const avg = data.length === 0 ? '0.0' : (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-muted font-mono tabular-nums">avg: {avg}/5</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label={`${label} trend chart, average ${avg} out of 5`}>
        <path d={linePath} fill="none" stroke="var(--accent-flow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent-flow)" />
        ))}
        {points.map((p, i) => (
          <text key={`l-${i}`} x={p.x} y={height - 4} textAnchor="middle" fill="var(--text-muted)" fontSize="9">
            {DAY_LABELS[i]}
          </text>
        ))}
      </svg>
    </Card>
  );
}

export function InsightsDashboard({ data, className }: InsightsDashboardProps) {
  const moodData = useMemo(() => data.map((d) => d.mood), [data]);
  const energyData = useMemo(() => data.map((d) => d.energy), [data]);

  const bestFocus = useMemo(() => {
    if (data.length === 0) return 'No data yet';
    const focusData = data.map((d) => d.focus);
    const maxVal = Math.max(...focusData);
    const peakIdx = focusData.indexOf(maxVal);
    return peakIdx <= 2 ? '10am\u201312pm' : '2pm\u20134pm';
  }, [data]);

  const avgMood = useMemo(
    () => data.length === 0 ? '0.0' : (data.reduce((a, d) => a + d.mood, 0) / data.length).toFixed(1),
    [data],
  );

  return (
    <div className={className}>
      <div className="flex flex-col gap-5">
        <LineChart data={moodData} label="Mood" />
        <LineChart data={energyData} label="Energy" />

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-text-muted mb-1">Best focus</p>
            <p className="text-sm font-medium text-text-primary font-mono tabular-nums">{bestFocus}</p>
          </Card>
          <Card>
            <p className="text-xs text-text-muted mb-1">Avg mood</p>
            <p className="text-sm font-medium text-text-primary font-mono tabular-nums">{avgMood}/5</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
