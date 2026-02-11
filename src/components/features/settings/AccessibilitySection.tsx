'use client';

import { Card } from '@/components/ui';
import { Toggle } from './Toggle';
import clsx from 'clsx';

const FONT_SIZES = ['Small', 'Medium', 'Large'] as const;

interface AccessibilitySectionProps {
  reducedMotion: boolean;
  fontSize: string;
  onReducedMotionChange: (v: boolean) => void;
  onFontSizeChange: (v: string) => void;
}

export function AccessibilitySection({
  reducedMotion, fontSize, onReducedMotionChange, onFontSizeChange,
}: AccessibilitySectionProps) {
  return (
    <Card header={<h2 className="text-sm font-semibold text-text-primary">Accessibility</h2>}>
      <div className="flex flex-col gap-3">
        <Toggle checked={reducedMotion} onChange={onReducedMotionChange} label="Reduced motion" />
        <div>
          <span className="text-sm text-text-primary block mb-2">Font size</span>
          <div className="flex gap-2">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onFontSizeChange(size)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer',
                  fontSize === size
                    ? 'bg-accent-flow/10 text-accent-flow'
                    : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08]',
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
