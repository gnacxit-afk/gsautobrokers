'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';

/**
 * This is the root page of the application.
 * Its sole purpose is to redirect the user to the appropriate page
 * based on their authentication status.
 */
export default function RootPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication status is determined
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to the main dashboard
        router.replace('/dashboard');
      } else {
        // If no user, redirect to the login page
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // Display a loading spinner while checking auth status to prevent flicker
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Logo />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Application...</p>
    </div>
  );
}
