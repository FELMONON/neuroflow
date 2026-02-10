import { Skeleton } from '@/components/ui';

export default function BodyDoubleLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width="160px" />
        <Skeleton variant="text" width="120px" height={32} />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" width={8} />
                <div>
                  <Skeleton variant="text" width="140px" />
                  <div className="mt-1">
                    <Skeleton variant="text" width="100px" />
                  </div>
                </div>
              </div>
              <Skeleton variant="text" width="60px" height={32} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
