'use client';

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : '?';

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden flex items-center justify-center shrink-0',
        'bg-bg-tertiary text-text-secondary font-medium',
        sizeStyles[size],
        className,
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt ?? name ?? 'Avatar'}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <span aria-label={name ?? 'User'}>{initials}</span>
      )}
    </div>
  );
}

export { Avatar };
export type { AvatarProps, AvatarSize };
