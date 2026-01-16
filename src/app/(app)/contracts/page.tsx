'use client';

import { useMemo } from 'react';
import type { EmploymentContract, ContractSignature, Staff, ContractEvent } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, orderBy, query, where } from 'firebase/firestore';
import { AccessDenied } from '@/components/access-denied';
import { ContractsClient } from './components/contracts-client';

export default function ContractsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const contractsQuery = useMemo(() => 
    firestore 
      ? query(collection(firestore, 'contracts'), orderBy('createdAt', 'desc')) 
      : null
  , [firestore]);
  const { data: contracts, loading: contractsLoading } = useCollection<EmploymentContract>(contractsQuery);

  const activeContract = useMemo(() => contracts?.find(c => c.isActive), [contracts]);

  const signaturesQuery = useMemo(() =>
    firestore && activeContract ? query(collection(firestore, 'signatures'), where('contractId', '==', activeContract.id)) : null
  , [firestore, activeContract]);
  const { data: signatures, loading: signaturesLoading } = useCollection<ContractSignature>(signaturesQuery);

  const staffQuery = useMemo(() =>
    firestore ? collection(firestore, 'staff') : null
  , [firestore]);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const eventsQuery = useMemo(() =>
      firestore ? query(collection(firestore, 'contract_events'), orderBy('timestamp', 'desc')) : null
  , [firestore]);
  const { data: events, loading: eventsLoading } = useCollection<ContractEvent>(eventsQuery);


  if (userLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }

  if (user?.role !== 'Admin') {
    return <AccessDenied />;
  }

  const loading = contractsLoading || signaturesLoading || staffLoading || eventsLoading;

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Contract Management</h1>
        <p className="text-muted-foreground">
          Create, manage, and track employment contracts and signatures.
        </p>
      </div>
      <ContractsClient 
        initialContracts={contracts || []}
        activeContract={activeContract || null}
        signatures={signatures || []}
        allStaff={staff || []}
        events={events || []}
        loading={loading}
      />
    </main>
  );
}
