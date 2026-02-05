'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate, Staff } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';
import { CallScript } from '../../components/call-script';

export default function InterviewsPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', 'Interviews'),
      orderBy('lastStatusChangeDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading: candidatesLoading } = useCollection<Candidate>(candidatesQuery);

  const staffQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'staff'));
  }, [firestore]);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <CandidateTable
          title="Interviews"
          description="Conduct quick interview calls to approve or reject candidates."
          candidates={candidates || []}
          isLoading={candidatesLoading || staffLoading}
          allStaff={staff || []}
        />
      </div>
      <div className="lg:col-span-1">
        <CallScript />
      </div>
    </main>
  );
}
