import { Skeleton } from '@/components/ui';

export default function PlanLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <Skeleton variant="text" width="120px" />

      {/* Date nav skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton variant="text" width="36px" height={36} />
        <Skeleton variant="text" width="200px" />
        <Skeleton variant="text" width="36px" height={36} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="flex flex-col gap-4">
          {/* Intention skeleton */}
          <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
            <Skeleton variant="text" width="130px" />
            <div className="mt-2">
              <Skeleton variant="text" width="100%" height={56} />
            </div>
          </div>

          {/* Time blocks skeleton */}
          <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
            <Skeleton variant="text" width="100px" />
            <div className="mt-3">
              <Skeleton variant="list" lines={5} />
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <Skeleton variant="text" width="140px" />
          <div className="mt-3">
            <Skeleton variant="list" lines={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
