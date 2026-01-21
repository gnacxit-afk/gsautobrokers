import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';
// The Next.js Image component is no longer needed.
// import Image from 'next/image';

export function Logo({ className, width = 180, height = 50, ...props }: { className?: string, width?: number, height?: number }) {
  return (
    <div
      className={cn('relative', className)}
      {...props}
    >
      {/* Reverted to a standard <img> tag to bypass any Next.js image optimization issues
          and ensure the logo is displayed directly from the source URL. */}
      <img 
        src="https://storage.googleapis.com/gen-prod-public-images/user-images/f7b03681-42e3-4674-8b65-6e42b26002f2.png"
        alt="GS Autobrokers Logo"
        width={width}
        height={height}
        style={{ objectFit: 'contain' }}
      />
    </div>
  );
}
