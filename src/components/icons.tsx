import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo(props: Partial<ComponentProps<'div'>>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn('text-2xl font-bold text-slate-800', className)}
      {...rest}
    >
      GS AutoBrokers
    </div>
  );
}
