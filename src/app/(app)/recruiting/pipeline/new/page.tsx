'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';

export default function NewApplicantsPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', 'in', ['New Applicant', 'Applied']),
      orderBy('appliedDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading } = useCollection<Candidate>(candidatesQuery);

  return (
    <CandidateTable
      title="New Applicants"
      description="Review and process newly applied candidates."
      candidates={candidates || []}
      isLoading={loading}
    />
  );
}
