'use client';

import { Code, BookOpen, Palette, Coffee, Headphones } from 'lucide-react';
import { Input, Modal, Button } from '@/components/ui';
import clsx from 'clsx';

const ICON_OPTIONS = [
  { key: 'code', label: 'Coding', Icon: Code },
  { key: 'book', label: 'Reading', Icon: BookOpen },
  { key: 'art', label: 'Creative', Icon: Palette },
  { key: 'coffee', label: 'Casual', Icon: Coffee },
  { key: 'headphones', label: 'Music', Icon: Headphones },
];

interface NewRoomData {
  title: string;
  description: string;
  icon: string;
  maxParticipants: string;
}

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  newRoom: NewRoomData;
  onUpdateNewRoom: (updater: (prev: NewRoomData) => NewRoomData) => void;
  onCreate: () => void;
}

export function CreateRoomModal({ open, onClose, newRoom, onUpdateNewRoom, onCreate }: CreateRoomModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Create a room">
      <div className="flex flex-col gap-4">
        <Input
          label="Room name"
          placeholder="e.g. Morning Deep Work"
          value={newRoom.title}
          onChange={(e) => onUpdateNewRoom((prev) => ({ ...prev, title: e.target.value }))}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Description</label>
          <textarea
            value={newRoom.description}
            onChange={(e) => onUpdateNewRoom((prev) => ({ ...prev, description: e.target.value }))}
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
                onClick={() => onUpdateNewRoom((prev) => ({ ...prev, icon: key }))}
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
          onChange={(e) => onUpdateNewRoom((prev) => ({ ...prev, maxParticipants: e.target.value }))}
        />
        <Button onClick={onCreate} disabled={!newRoom.title.trim()}>
          Create room
        </Button>
      </div>
    </Modal>
  );
}
