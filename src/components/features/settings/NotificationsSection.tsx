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

export function NotificationsSection({
  morningReminder, focusReminder, eveningReminder,
  onMorningChange, onFocusChange, onEveningChange,
}: NotificationsSectionProps) {
  return (
    <Card header={<h2 className="text-sm font-semibold text-text-primary">Notifications</h2>}>
      <div className="flex flex-col">
        <Toggle checked={morningReminder} onChange={onMorningChange} label="Morning planning reminder" />
        <Toggle checked={focusReminder} onChange={onFocusChange} label="Focus session reminder" />
        <Toggle checked={eveningReminder} onChange={onEveningChange} label="Evening check-in" />
      </div>
    </Card>
  );
}
