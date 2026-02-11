'use client';

import { Card } from '@/components/ui';
import { Toggle } from './Toggle';

interface NotificationsSectionProps {
  morningReminder: boolean;
  focusReminder: boolean;
  eveningReminder: boolean;
  onMorningChange: (v: boolean) => void;
  onFocusChange: (v: boolean) => void;
  onEveningChange: (v: boolean) => void;
}

const comingSoonBadge = (
  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-flow/10 text-accent-flow">Coming soon</span>
);

export function NotificationsSection({
  morningReminder, focusReminder, eveningReminder,
  onMorningChange, onFocusChange, onEveningChange,
}: NotificationsSectionProps) {
  return (
    <Card header={
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
        {comingSoonBadge}
      </div>
    }>
      <p className="text-xs text-text-muted mb-3">
        Set your preferences now — we&apos;ll notify you once push notifications are live.
      </p>
      <div className="flex flex-col">
        <Toggle checked={morningReminder} onChange={onMorningChange} label="Morning planning reminder" />
        <Toggle checked={focusReminder} onChange={onFocusChange} label="Focus session reminder" />
        <Toggle checked={eveningReminder} onChange={onEveningChange} label="Evening check-in" />
      </div>
    </Card>
  );
}
