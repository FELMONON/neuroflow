'use client';

import { Volume2, CloudRain, Wind, Coffee, VolumeX } from 'lucide-react';

const SOUNDSCAPES = [
  { id: 'silence', icon: VolumeX, label: 'Off' },
  { id: 'brown_noise', icon: Volume2, label: 'Brown' },
  { id: 'rain', icon: CloudRain, label: 'Rain' },
  { id: 'wind', icon: Wind, label: 'Wind' },
  { id: 'cafe', icon: Coffee, label: 'Cafe' },
];

interface SoundscapeSelectorProps {
  selected: string;
  onSelect: (soundscape: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

function SoundscapeSelector({ selected, onSelect, volume, onVolumeChange }: SoundscapeSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-2" role="group" aria-label="Soundscape">
      <div className="flex gap-1" role="radiogroup" aria-label="Soundscape selection">
        {SOUNDSCAPES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            role="radio"
            aria-checked={selected === id}
            aria-label={label}
            onClick={() => onSelect(id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-flow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none ${
              selected === id
                ? 'bg-accent-flow/15 border border-accent-flow/30 text-accent-flow'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="text-[10px]">{label}</span>
          </button>
        ))}
      </div>
      {selected !== 'silence' && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          aria-label="Volume"
          className="w-24 accent-accent-flow"
        />
      )}
    </div>
  );
}

export { SoundscapeSelector };
export type { SoundscapeSelectorProps };
