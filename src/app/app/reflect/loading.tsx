import { Skeleton } from '@/components/ui';

export default function ReflectLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Skeleton variant="text" width="100px" />

      {/* Tab skeleton */}
      <Skeleton variant="text" width="200px" height={36} />

      {/* Check-in card skeleton */}
      <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
        <Skeleton variant="text" width="120px" />
        <div className="mt-4 flex flex-col gap-4">
          <Skeleton variant="text" width="100%" height={48} />
          <Skeleton variant="text" width="100%" height={48} />
          <Skeleton variant="text" width="100%" height={48} />
        </div>
      </div>

      {/* Reflection card skeleton */}
      <div className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
        <Skeleton variant="text" width="160px" />
        <div className="mt-4">
          <Skeleton variant="text" width="100%" height={80} />
        </div>
      </div>
    </div>
  );
}
