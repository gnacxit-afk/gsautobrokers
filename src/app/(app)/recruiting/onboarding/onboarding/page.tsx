
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Rocket } from 'lucide-react';

export default function OnboardingPage() {
  const firestore = useFirestore();

  const candidatesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'candidates'),
      where('pipelineStatus', '==', 'Onboarding'),
      orderBy('lastStatusChangeDate', 'desc')
    );
  }, [firestore]);

  const { data: candidates, loading } = useCollection<Candidate>(candidatesQuery);

  return (
    <main className="flex-1 space-y-6">
      <Alert>
        <Rocket className="h-4 w-4" />
        <AlertTitle>Reglas de automatización</AlertTitle>
        <AlertDescription>
          Los candidatos en esta etapa durante más de 48 horas sin responder 'LISTO' pasarán automáticamente a 'Inactivo'.
        </AlertDescription>
      </Alert>

      <CandidateTable
        title="Onboarding Process"
        description="Track candidates through onboarding. Follow up within 48 hours."
        candidates={candidates || []}
        isLoading={loading}
      />
    </main>
  );
}

    
