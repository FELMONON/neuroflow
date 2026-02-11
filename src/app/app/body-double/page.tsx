'use client';

import { useState } from 'react';
import { Plus, Users, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, EmptyState } from '@/components/ui';
import { RoomCard } from '@/components/features/body-double/RoomCard';
import { CreateRoomModal } from '@/components/features/body-double/CreateRoomModal';
import { useProfileStore } from '@/stores/useProfileStore';
import { useBodyDoubleRooms } from '@/hooks/useBodyDoubleRooms';

function PresenceDot({ delay }: { delay: number }) {
  return (
    <motion.div
      className="w-1.5 h-1.5 rounded-full bg-accent-grow"
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};
const containerVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function BodyDoublePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ title: '', description: '', icon: 'code', maxParticipants: '6' });
  const profileId = useProfileStore((s) => s.profile?.id ?? '');
  const displayName = useProfileStore((s) => s.profile?.display_name ?? 'You');

  const { rooms, joinedRoom, handleCreate, handleJoin, handleLeave } = useBodyDoubleRooms(profileId, displayName);

  const totalFocusing = rooms.reduce((sum, r) => sum + r.participants.length, 0);

  const onCreateRoom = async () => {
    await handleCreate(newRoom);
    setNewRoom({ title: '', description: '', icon: 'code', maxParticipants: '6' });
    setShowCreate(false);
  };

  return (
    <motion.div
      variants={pageVariants} initial="initial" animate="animate" exit="exit"
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
      className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6 pb-24 md:pb-8"
    >
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

      {totalFocusing > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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
            {rooms.map((room) => (
              <motion.div key={room.id} variants={itemVariants} layout>
                <RoomCard
                  room={room} isJoined={joinedRoom === room.id} profileId={profileId}
                  onJoin={handleJoin} onLeave={handleLeave}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <CreateRoomModal
        open={showCreate} onClose={() => setShowCreate(false)}
        newRoom={newRoom} onUpdateNewRoom={setNewRoom} onCreate={onCreateRoom}
      />
    </motion.div>
  );
}
