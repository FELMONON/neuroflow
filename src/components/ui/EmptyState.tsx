'use client';

import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-accent-flow/10 flex items-center justify-center mb-4 [&>svg]:w-6 [&>svg]:h-6 text-accent-flow">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-white/[0.8] mb-1">{title}</h3>
      <p className="text-xs text-white/[0.4] max-w-[240px] mx-auto">{description}</p>
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export type { EmptyStateProps };
