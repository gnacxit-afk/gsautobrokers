
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { CandidateTable } from '../components/candidate-table';

export default function RejectedCandidatesPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', 'Rejected'),
      orderBy('lastStatusChangeDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading } = useCollection<Candidate>(candidatesQuery);

  return (
    <CandidateTable
      title="Rejected Candidates"
      description="Candidates who have been rejected during the selection process."
      candidates={candidates || []}
      isLoading={loading}
    />
  );
}

    
