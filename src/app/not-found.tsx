import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-4 text-center">
      <div className="w-12 h-12 rounded-full bg-accent-flow/10 flex items-center justify-center mb-4">
        <Compass className="w-6 h-6 text-accent-flow" />
      </div>
      <h2 className="text-sm font-medium text-white/[0.8] mb-1">
        Page not found
      </h2>
      <p className="text-xs text-white/[0.4] max-w-[240px] mx-auto mb-6">
        Looks like you wandered off the path. Let&apos;s get you back.
      </p>
      <Link
        href="/app/today"
        className="bg-accent-flow hover:bg-accent-flow/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]"
      >
        Go home
      </Link>
    </div>
  );
}
