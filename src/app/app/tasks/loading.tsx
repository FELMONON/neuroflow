import { Skeleton } from '@/components/ui';

export default function TasksLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <Skeleton variant="text" width="100px" />
        <div className="mt-2">
          <Skeleton variant="text" width="60px" />
        </div>
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="text" width="70px" height={32} />
        ))}
      </div>

      {/* Task list skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton variant="list" lines={6} />
      </div>
    </div>
  );
}
