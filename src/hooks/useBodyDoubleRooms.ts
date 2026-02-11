'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Participant {
  id: string;
  userId: string;
  name: string;
  task: string;
  joinedMinutesAgo: number;
}

export interface Room {
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

interface NewRoomInput {
  title: string;
  description: string;
  icon: string;
  maxParticipants: string;
}

export function useBodyDoubleRooms(profileId: string, displayName: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);

  useEffect(() => {
    async function loadRooms() {
      try {
        const supabase = createClient();
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

  const handleCreate = useCallback(async (newRoom: NewRoomInput) => {
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
  }, [profileId]);

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

  return { rooms, joinedRoom, handleCreate, handleJoin, handleLeave };
}
