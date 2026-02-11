'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Plus, Users, Timer, X, Radio, Headphones, Coffee, BookOpen, Code, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, EmptyState, Input, Modal } from '@/components/ui';
import { useProfileStore } from '@/stores/useProfileStore';
import { createClient } from '@/lib/supabase/client';
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
  focus: string;
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

const ICON_OPTIONS = [
  { key: 'code', label: 'Coding', Icon: Code },
  { key: 'book', label: 'Reading', Icon: BookOpen },
  { key: 'art', label: 'Creative', Icon: Palette },
  { key: 'coffee', label: 'Casual', Icon: Coffee },
  { key: 'headphones', label: 'Music', Icon: Headphones },
];

// No more mock rooms - data comes from Supabase

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

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const containerVariants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function BodyDoublePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({ title: '', description: '', icon: 'code', maxParticipants: '6' });
  const profileId = useProfileStore((s) => s.profile?.id ?? '');
  const displayName = useProfileStore((s) => s.profile?.display_name ?? 'You');

  // Load rooms from Supabase
  useEffect(() => {
    async function loadRooms() {
      try {
        const supabase = createClient();

        // Fetch rooms and participants separately to avoid Supabase relation inference issues
        const { data: roomData, error: roomError } = await supabase
          .from('body_double_rooms')
          .select('*')
          .eq('is_active', true);

        if (roomError || !roomData) {
          console.error('[BodyDouble] Failed to load rooms:', roomError);
          return;
        }

        const roomIds = roomData.map((r) => r.id);
        let participants: { id: string; room_id: string; user_id: string; current_task: string | null; joined_at: string; left_at: string | null }[] = [];

        if (roomIds.length > 0) {
          const { data: partData, error: partError } = await supabase
            .from('room_participants')
            .select('id, room_id, user_id, current_task, joined_at, left_at')
            .in('room_id', roomIds)
            .is('left_at', null);

          if (!partError && partData) {
            participants = partData;
          }
        }

        setRooms(roomData.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.current_focus ?? 'An open room for focused work.',
          participants: participants
            .filter((p) => p.room_id === r.id)
            .map((p) => ({
              id: p.id,
              userId: p.user_id,
              name: p.user_id === profileId ? 'You' : `User ${p.id.slice(0, 4)}`,
              task: p.current_task ?? 'Focusing',
              joinedMinutesAgo: Math.floor((Date.now() - new Date(p.joined_at).getTime()) / 60000),
            })),
          maxParticipants: r.max_participants ?? 6,
          focus: r.current_focus ?? '',
          icon: 'code',
          timerMinutes: 25,
          timerStartedAt: r.started_at ? new Date(r.started_at).getTime() : null,
        })));
      } catch (err) {
        console.error('[BodyDouble] Failed to load rooms:', err);
      }
    }
    loadRooms();
  }, [profileId]);

  const totalFocusing = rooms.reduce((sum, r) => sum + r.participants.length, 0);

  const handleCreate = useCallback(async () => {
    if (!newRoom.title.trim() || !profileId) return;
    const id = crypto.randomUUID();
    const room: Room = {
      id,
      title: newRoom.title.trim(),
      description: newRoom.description.trim() || 'An open room for focused work.',
      participants: [],
      maxParticipants: parseInt(newRoom.maxParticipants) || 6,
      focus: newRoom.title.trim(),
      icon: newRoom.icon,
      timerMinutes: 25,
      timerStartedAt: null,
    };
    setRooms((prev) => [room, ...prev]);
    setNewRoom({ title: '', description: '', icon: 'code', maxParticipants: '6' });
    setShowCreate(false);

    // Persist to Supabase — rollback on failure
    const supabase = createClient();
    const { error } = await supabase
      .from('body_double_rooms')
      .insert({
        id,
        host_id: profileId,
        title: room.title,
        room_type: 'open',
        max_participants: room.maxParticipants,
        current_focus: room.description,
        is_active: true,
        started_at: new Date().toISOString(),
      });
    if (error) {
      console.error('[BodyDouble] Failed to create room:', error);
      setRooms((prev) => prev.filter((r) => r.id !== id));
    }
  }, [newRoom, profileId]);

  const handleJoin = useCallback(async (roomId: string) => {
    if (!profileId) return;
    setJoinedRoom(roomId);
    const participantId = crypto.randomUUID();
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              participants: [
                ...r.participants,
                { id: participantId, userId: profileId, name: displayName, task: 'Getting started', joinedMinutesAgo: 0 },
              ],
            }
          : r,
      ),
    );

    // Persist to Supabase — rollback on failure
    const supabase = createClient();
    const { error } = await supabase
      .from('room_participants')
      .insert({
        id: participantId,
        room_id: roomId,
        user_id: profileId,
        current_task: 'Getting started',
        joined_at: new Date().toISOString(),
      });
    if (error) {
      console.error('[BodyDouble] Failed to join room:', error);
      setJoinedRoom(null);
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, participants: r.participants.filter((p) => p.id !== participantId) }
            : r,
        ),
      );
    }
  }, [profileId, displayName]);

  const handleLeave = useCallback(async () => {
    if (!profileId || !joinedRoom) return;
    // Find the participant by userId, not display name
    const room = rooms.find((r) => r.id === joinedRoom);
    const myParticipant = room?.participants.find((p) => p.userId === profileId);

    const previousParticipants = room?.participants ?? [];
    setRooms((prev) =>
      prev.map((r) =>
        r.id === joinedRoom
          ? { ...r, participants: r.participants.filter((p) => p.userId !== profileId) }
          : r,
      ),
    );
    setJoinedRoom(null);

    // Persist to Supabase — rollback on failure
    if (myParticipant) {
      const supabase = createClient();
      const { error } = await supabase
        .from('room_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('id', myParticipant.id);
      if (error) {
        console.error('[BodyDouble] Failed to leave room:', error);
        setJoinedRoom(joinedRoom);
        setRooms((prev) =>
          prev.map((r) =>
            r.id === joinedRoom
              ? { ...r, participants: previousParticipants }
              : r,
          ),
        );
      }
    }
  }, [joinedRoom, rooms, profileId]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6 pb-24 md:pb-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Co-work</h1>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Create room
          </Button>
        </div>
        <p className="text-sm text-text-muted">
          Body doubling — work alongside others. That&apos;s momentum.
        </p>
      </div>

      {/* Live indicator */}
      {totalFocusing > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-grow/10 border border-accent-grow/20"
        >
          <Radio size={14} className="text-accent-grow" />
          <span className="text-sm text-accent-grow font-medium">
            {totalFocusing} {totalFocusing === 1 ? 'person' : 'people'} focusing right now
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <PresenceDot delay={0} />
            <PresenceDot delay={0.5} />
            <PresenceDot delay={1.0} />
          </div>
        </motion.div>
      )}

      {/* Rooms */}
      {rooms.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No rooms yet"
          description="Create a room to work alongside others. Sometimes just having someone nearby makes all the difference."
          action={{ label: 'Create a Room', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="flex flex-col gap-3">
          <AnimatePresence>
            {rooms.map((room) => {
              const RoomIcon = ROOM_ICONS[room.icon] || Code;
              const isJoined = joinedRoom === room.id;
              const isFull = room.participants.length >= room.maxParticipants;

              return (
                <motion.div key={room.id} variants={itemVariants} layout>
                  <Card className={clsx(isJoined && 'border-accent-flow/30 bg-accent-flow/[0.03]')}>
                    <div className="flex flex-col gap-3">
                      {/* Room header */}
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

                      {/* Participants presence */}
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
                              <PresenceDot delay={Math.random() * 2} />
                              <span className="font-medium">{p.name}</span>
                              <span className="text-text-muted hidden sm:inline">- {p.task}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timer + actions */}
                      <div className="flex items-center justify-between pl-12">
                        <div className="flex items-center gap-2">
                          <Timer size={12} className="text-text-muted" />
                          <RoomTimer startedAt={room.timerStartedAt} totalMinutes={room.timerMinutes} />
                        </div>
                        {isJoined ? (
                          <Button variant="ghost" size="sm" onClick={handleLeave}>
                            Leave
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoin(room.id)}
                            disabled={isFull}
                          >
                            {isFull ? 'Full' : 'Join'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create room modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a room">
        <div className="flex flex-col gap-4">
          <Input
            label="Room name"
            placeholder="e.g. Morning Deep Work"
            value={newRoom.title}
            onChange={(e) => setNewRoom((prev) => ({ ...prev, title: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Description</label>
            <textarea
              value={newRoom.description}
              onChange={(e) => setNewRoom((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What's the vibe? Mics on or off? What kind of work?"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent-flow/20 focus:border-accent-flow/50 transition-colors duration-150"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Room type</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewRoom((prev) => ({ ...prev, icon: key }))}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer',
                    newRoom.icon === key
                      ? 'bg-accent-flow/10 text-accent-flow border border-accent-flow/20'
                      : 'bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:bg-white/[0.08]',
                  )}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Max participants"
            type="number"
            min={2}
            max={12}
            value={newRoom.maxParticipants}
            onChange={(e) => setNewRoom((prev) => ({ ...prev, maxParticipants: e.target.value }))}
          />
          <Button onClick={handleCreate} disabled={!newRoom.title.trim()}>
            Create room
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
