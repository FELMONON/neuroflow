'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="w-12 h-12 rounded-full bg-accent-spark/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-accent-spark" />
      </div>
      <h2 className="text-sm font-medium text-white/[0.8] mb-1">
        Something went sideways
      </h2>
      <p className="text-xs text-white/[0.4] max-w-[280px] mx-auto mb-6">
        That wasn&apos;t supposed to happen. Try again, and if it keeps up, we&apos;ll sort it out.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
