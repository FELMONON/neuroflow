import { Skeleton } from '@/components/ui';

export default function TodayLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Greeting header skeleton */}
        <div>
          <Skeleton variant="text" width="60%" />
          <div className="mt-2">
            <Skeleton variant="text" width="40%" />
          </div>
        </div>

        {/* Focus card skeleton */}
        <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <Skeleton variant="text" width="30%" />
          <div className="mt-3">
            <Skeleton variant="text" width="70%" />
          </div>
          <div className="mt-4">
            <Skeleton variant="text" width="120px" height={40} />
          </div>
        </div>

        {/* Tasks skeleton */}
        <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <Skeleton variant="list" lines={5} />
        </div>

        {/* Schedule skeleton */}
        <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <Skeleton variant="list" lines={4} />
        </div>

        {/* Habits skeleton */}
        <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <Skeleton variant="list" lines={4} />
        </div>
      </div>
    </div>
  );
}
