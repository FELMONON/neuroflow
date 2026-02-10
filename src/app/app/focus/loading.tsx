import { Skeleton } from '@/components/ui';

export default function FocusLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-bg-primary">
      <div className="max-w-md mx-auto py-8 px-4 space-y-8">
        <div>
          <Skeleton variant="text" width="180px" />
          <div className="mt-2">
            <Skeleton variant="text" width="240px" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton variant="text" width="40px" />
          <Skeleton variant="text" width="100%" height={40} />
        </div>

        <div className="space-y-2">
          <Skeleton variant="text" width="60px" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="text" width="100%" height={40} />
            ))}
          </div>
        </div>

        <Skeleton variant="text" width="100%" height={44} />
      </div>
    </div>
  );
}
