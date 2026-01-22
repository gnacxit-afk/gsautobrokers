
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { CandidateTable } from '../components/candidate-table';

export default function ActiveCandidatesPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', 'Active'),
      orderBy('lastStatusChangeDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading } = useCollection<Candidate>(candidatesQuery);

  return (
    <main className="flex-1 space-y-6">
      <CandidateTable
        title="Active Candidates"
        description="Candidates who have successfully completed training and are now active staff members."
        candidates={candidates || []}
        isLoading={loading}
      />
    </main>
  );
}
