'use client';

import { ChevronDown } from 'lucide-react';
import { Card, Input } from '@/components/ui';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT / BST' },
  { value: 'Europe/Berlin', label: 'Central European Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
];

interface ProfileSectionProps {
  name: string;
  timezone: string;
  onNameChange: (v: string) => void;
  onTimezoneChange: (v: string) => void;
}

export function ProfileSection({ name, timezone, onNameChange, onTimezoneChange }: ProfileSectionProps) {
  return (
    <Card header={<h2 className="text-sm font-semibold text-text-primary">Profile</h2>}>
      <div className="flex flex-col gap-4">
        <Input label="Name" value={name} onChange={(e) => onNameChange(e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Timezone</label>
          <div className="relative">
            <select
              value={timezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
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
  );
}
