import { Skeleton } from '@/components/ui';

export default function DopamineMenuLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Skeleton variant="text" width="160px" />

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-3">
            <Skeleton variant="text" width="120px" />
            <Skeleton variant="text" width="60px" height={28} />
          </div>
          <Skeleton variant="list" lines={3} />
        </div>
      ))}
    </div>
  );
}
