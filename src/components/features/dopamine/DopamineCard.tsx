'use client';

interface DopamineCardProps {
  title: string;
  duration: string;
  notes?: string;
}

export function DopamineCard({ title, duration, notes }: DopamineCardProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border border-white/[0.06] rounded-lg hover:border-white/[0.10] hover:bg-white/[0.02] transition-all duration-150">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-text-primary">{title}</span>
        {notes && <span className="text-xs text-text-muted">{notes}</span>}
      </div>
      <span className="bg-white/[0.06] rounded-full px-2 py-0.5 text-xs text-text-muted shrink-0 ml-4">
        {duration}
      </span>
    </div>
  );
}
