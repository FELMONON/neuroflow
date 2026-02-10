'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface WelcomeStepProps {
  name: string;
  onNameChange: (name: string) => void;
  onContinue: () => void;
}

export function WelcomeStep({ name, onNameChange, onContinue }: WelcomeStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) onContinue();
  };

  return (
    <div className="flex flex-col items-center px-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-semibold text-text-primary text-center">
        What can we call you?
      </h2>

      <div className="w-full max-w-sm mt-8">
        <Input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Your name"
        />
      </div>

      <div className="mt-8">
        <Button size="lg" disabled={!name.trim()} onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export type { WelcomeStepProps };
