import Image from 'next/image';
import type { ComponentProps } from 'react';

export function Logo(props: Partial<ComponentProps<typeof Image>>) {
  return <Image src="https://storage.googleapis.com/stabl-media/69796792-2621-4a57-96a1-6a59600d8977.png" alt="GS Auto Brokers Logo" width={150} height={35} {...props} />;
}
