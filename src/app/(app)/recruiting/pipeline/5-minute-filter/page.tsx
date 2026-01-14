'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';
import { CallScript } from '../../components/call-script';

export default function FiveMinuteFilterPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', '5-Min Filter'),
      orderBy('appliedDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading } = useCollection<Candidate>(candidatesQuery);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <CandidateTable
          title="5-Minute Filter"
          description="Conduct quick interview calls to approve or reject candidates."
          candidates={candidates || []}
          isLoading={loading}
        />
      </div>
      <div className="lg:col-span-1">
        <CallScript />
      </div>
    </main>
  );
}
