import { Skeleton } from '@/components/ui';

export default function AchievementsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Skeleton variant="text" width="140px" />

      {/* Level progress skeleton */}
      <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
        <Skeleton variant="text" width="100px" />
        <div className="mt-3">
          <Skeleton variant="text" width="100%" height={8} />
        </div>
        <div className="mt-2">
          <Skeleton variant="text" width="60px" />
        </div>
      </div>

      {/* Tab filter skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="60px" height={28} />
        ))}
      </div>

      {/* Achievement grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
            <div className="flex items-center gap-3">
              <Skeleton variant="circle" width={40} />
              <div className="flex-1">
                <Skeleton variant="text" width="70%" />
                <div className="mt-1">
                  <Skeleton variant="text" width="90%" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
