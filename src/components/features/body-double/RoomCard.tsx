'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Timer, Code, BookOpen, Palette, Coffee, Headphones } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import clsx from 'clsx';

interface Participant {
  id: string;
  userId: string;
  name: string;
  task: string;
  joinedMinutesAgo: number;
}

interface Room {
  id: string;
  title: string;
  description: string;
  participants: Participant[];
  maxParticipants: number;
  icon: string;
  timerMinutes: number;
  timerStartedAt: number | null;
}

const ROOM_ICONS: Record<string, typeof Code> = {
  code: Code,
  book: BookOpen,
  art: Palette,
  coffee: Coffee,
  headphones: Headphones,
};

function PresenceDot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-1.5 h-1.5 rounded-full bg-accent-grow"
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function RoomTimer({ startedAt, totalMinutes }: { startedAt: number | null; totalMinutes: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) {
    return (
      <span className="text-xs text-text-muted font-mono tabular-nums">
        {totalMinutes}:00 ready
      </span>
    );
  }

  const remaining = Math.max(0, totalMinutes * 60 - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = Math.min(1, elapsed / (totalMinutes * 60));

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent-flow"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-xs text-accent-flow font-mono tabular-nums">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
}

interface RoomCardProps {
  room: Room;
  isJoined: boolean;
  profileId: string;
  onJoin: (roomId: string) => void;
  onLeave: () => void;
}

export function RoomCard({ room, isJoined, profileId, onJoin, onLeave }: RoomCardProps) {
  const RoomIcon = ROOM_ICONS[room.icon] ?? Code;
  const isFull = room.participants.length >= room.maxParticipants;

  // Pre-compute stable random delays keyed by participant id
  const participantDelays = useMemo(
    () => new Map(room.participants.map((p, i) => [p.id, ((i * 7 + 3) % 20) / 10])),
    [room.participants],
  );

  return (
    <Card className={clsx(isJoined && 'border-accent-flow/30 bg-accent-flow/[0.03]')}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
              <RoomIcon size={16} className="text-text-secondary" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h3 className="text-sm font-medium text-text-primary">{room.title}</h3>
              <p className="text-xs text-text-muted line-clamp-1">{room.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 bg-white/[0.06] rounded-full px-2.5 py-0.5 text-xs font-medium text-text-secondary">
              <Users size={12} />
              <span className="font-mono tabular-nums">
                {room.participants.length}/{room.maxParticipants}
              </span>
            </span>
          </div>
        </div>

        {room.participants.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-12">
            {room.participants.map((p) => (
              <div
                key={p.id}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
                  p.userId === profileId
                    ? 'bg-accent-flow/10 text-accent-flow border border-accent-flow/20'
                    : 'bg-white/[0.04] text-text-secondary',
                )}
              >
                <PresenceDot delay={participantDelays.get(p.id) ?? 0} />
                <span className="font-medium">{p.name}</span>
                <span className="text-text-muted hidden sm:inline">- {p.task}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pl-12">
          <div className="flex items-center gap-2">
            <Timer size={12} className="text-text-muted" />
            <RoomTimer startedAt={room.timerStartedAt} totalMinutes={room.timerMinutes} />
          </div>
          {isJoined ? (
            <Button variant="ghost" size="sm" onClick={onLeave}>
              Leave
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onJoin(room.id)}
              disabled={isFull}
            >
              {isFull ? 'Full' : 'Join'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
