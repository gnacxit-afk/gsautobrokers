'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';

/**
 * This is the root page of the application.
 * Its sole purpose is to redirect the user to the main protected route (/dashboard).
 * The authentication guard is handled by the AppShell layout protecting the dashboard.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  // Display a loading spinner while redirecting to prevent flashing content.
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Logo />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Application...</p>
    </div>
  );
}
