'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/icons';

export default function RootPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect until the auth state is fully loaded
    if (loading) {
      return;
    }

    if (user) {
      // Redirect authenticated users to their primary dashboard.
      // KPI is a good default as all roles have access to it.
      router.replace('/kpi');
    } else {
      // Redirect unauthenticated users to the login page.
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Render a loading state while the redirection is happening.
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-100">
      <Logo />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  );
}
