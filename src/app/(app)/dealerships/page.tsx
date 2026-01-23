
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Dealership } from '@/lib/types';
import { AccessDenied } from '@/components/access-denied';
import { DealershipClient } from './components/dealership-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealershipsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const dealershipsQuery = useMemo(() =>
    firestore ? query(collection(firestore, 'dealerships'), orderBy('createdAt', 'desc')) : null
  , [firestore]);

  const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(dealershipsQuery);

  if (userLoading || dealershipsLoading) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  if (user?.role !== 'Admin') {
    return <AccessDenied />;
  }

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dealership Management</h1>
        <p className="text-muted-foreground">Add and manage your dealership partners.</p>
      </div>
      <DealershipClient
        initialDealerships={dealerships || []}
      />
    </main>
  );
}

    