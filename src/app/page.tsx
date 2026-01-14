

'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is a temporary component to redirect users from the root to the /crm/dashboard
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/crm/dashboard');
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}


    