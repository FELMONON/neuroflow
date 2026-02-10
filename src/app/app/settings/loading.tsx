import { Skeleton } from '@/components/ui';

export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <Skeleton variant="text" width="100px" />

      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-bg-secondary rounded-xl border border-white/[0.06] p-5">
          <Skeleton variant="text" width="80px" />
          <div className="mt-3">
            <Skeleton variant="list" lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}
