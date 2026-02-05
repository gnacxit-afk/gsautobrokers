'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate, Staff } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';

export default function ApprovedForOnboardingPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', 'Approved'),
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
    <main className="flex-1 space-y-6">
        <Alert>
            <Rocket className="h-4 w-4" />
            <AlertTitle>Automation Rules & Manual Actions</AlertTitle>
            <AlertDescription>
              When a candidate replies 'LISTO', use the 'Start Onboarding' action to move them to the Training stage. Candidates in this stage for over 48 hours should be followed up with or moved to 'Inactive'.
            </AlertDescription>
        </Alert>
        <CandidateTable
            title="Approved Candidates"
            description="Candidates who passed the interview and are ready to begin onboarding."
            candidates={candidates || []}
            isLoading={candidatesLoading || staffLoading}
            allStaff={staff || []}
        />
    </main>
  );
}
