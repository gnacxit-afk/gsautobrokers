'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate, Staff } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';

export default function NewApplicantsPage() {
  const firestore = useFirestore();

  // Query the 'candidates' collection for documents with the 'New Applicant' status.
  const applicationsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', 'New Applicant'),
      orderBy('appliedDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading: candidatesLoading } = useCollection<Candidate>(applicationsQuery);

  const staffQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'staff'));
  }, [firestore]);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  return (
    <main className="flex-1 space-y-6">
      <CandidateTable
        title="New Applicants"
        description="Candidates who have applied and passed the initial AI scoring filter."
        candidates={candidates || []}
        isLoading={candidatesLoading || staffLoading}
        allStaff={staff || []}
      />
    </main>
  );
}
