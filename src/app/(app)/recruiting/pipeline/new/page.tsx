
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Candidate, Application } from '@/lib/types';
import { CandidateTable } from '../../components/candidate-table';

export default function NewApplicantsPage() {
  const firestore = useFirestore();

  // Fetch from the public collection where new, raw applications are stored
  const applicationsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'publicApplications'),
      orderBy('appliedDate', 'desc')
    );
  }, [firestore]);

  const { data: applications, loading } = useCollection<Application>(applicationsQuery);

  // Adapt the raw application data to the format expected by the CandidateTable
  const candidates: Candidate[] = useMemo(() => {
    if (!applications) return [];
    return applications.map((app) => ({
      id: app.id, // Use the document ID from publicApplications
      fullName: app.fullName,
      email: app.email,
      pipelineStatus: 'New Applicant', // Assign a default status
      appliedDate: app.appliedDate,
      lastStatusChangeDate: app.appliedDate, // Set initial last change date
      source: app.source,
      whatsappNumber: app.whatsappNumber,
      // Other fields can be added here as needed, with default values
    }));
  }, [applications]);

  return (
    <CandidateTable
      title="New Applicants"
      description="Review and process newly applied candidates from the public form."
      candidates={candidates}
      isLoading={loading}
    />
  );
}

    