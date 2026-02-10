import { Skeleton } from '@/components/ui';

export default function HabitsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="100px" />
        <Skeleton variant="text" width="100px" height={32} />
      </div>

      {/* Grid skeleton */}
      <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5 mb-6">
        <Skeleton variant="text" width="120px" />
        <div className="mt-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} variant="text" width="100%" height={24} />
          ))}
        </div>
      </div>

      {/* Habit groups skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <Skeleton variant="text" width="80px" />
            <div className="mt-2 bg-bg-secondary rounded-xl border border-white/[0.06] p-4">
              <Skeleton variant="list" lines={3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
