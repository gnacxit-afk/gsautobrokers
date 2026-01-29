'use client';

import { cn } from '@/lib/utils';

export function Logo({ className, width = 180, height = 50, ...props }: { className?: string, width?: number, height?: number } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: `${width}px`, height: `${height}px` }}
      {...props}
    >
      <img
        src="https://i.postimg.cc/YqHJPbZG/GSAUTOLLC.png"
        alt="GS Autobrokers LLC Logo"
        style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
        }}
      />
    </div>
  );
}
