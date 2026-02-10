'use client';

import clsx from 'clsx';

type SkeletonVariant = 'text' | 'circle' | 'card' | 'list';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

function SkeletonBase({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={style}
      aria-hidden="true"
    />
  );
}

function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 3,
  className,
}: SkeletonProps) {
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number' ? `${height}px` : height;

  switch (variant) {
    case 'text':
      return (
        <div className={clsx('flex flex-col gap-2', className)}>
          <SkeletonBase
            className="h-4 rounded"
            style={{ width: w ?? '100%' }}
          />
        </div>
      );

    case 'circle':
      return (
        <SkeletonBase
          className={clsx('rounded-full shrink-0', className)}
          style={{ width: w ?? '40px', height: h ?? w ?? '40px' }}
        />
      );

    case 'card':
      return (
        <div
          className={clsx('rounded-2xl overflow-hidden', className)}
          style={{ width: w }}
        >
          <SkeletonBase
            className="w-full"
            style={{ height: h ?? '160px' }}
          />
          <div className="p-4 flex flex-col gap-3">
            <SkeletonBase className="h-5 w-3/4 rounded" />
            <SkeletonBase className="h-4 w-full rounded" />
            <SkeletonBase className="h-4 w-2/3 rounded" />
          </div>
        </div>
      );

    case 'list':
      return (
        <div className={clsx('flex flex-col gap-3', className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBase className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <SkeletonBase className="h-4 w-1/2 rounded" />
                <SkeletonBase className="h-3 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
  }
}

export { Skeleton };
export type { SkeletonProps, SkeletonVariant };
