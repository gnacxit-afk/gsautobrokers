'use client';

import Link from 'next/link';

export default function MovedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-2xl font-bold">This page has moved.</h1>
      <p className="text-muted-foreground">
        This pipeline stage is now called "Interviews".
      </p>
      <Link href="/recruiting/pipeline/interviews" className="mt-4 text-primary hover:underline">
        Go to the new Interviews page
      </Link>
    </div>
  );
}
