import Image from 'next/image';
import type { ComponentProps } from 'react';

export function Logo(props: Partial<ComponentProps<typeof Image>>) {
  return <Image src="/logo.png" alt="GS Auto Brokers Logo" width={150} height={35} {...props} />;
}
