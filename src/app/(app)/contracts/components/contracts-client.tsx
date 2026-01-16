'use client';

import { useMemo, useState } from 'react';
import type { EmploymentContract, ContractSignature, Staff, ContractEvent } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewContractForm } from './new-contract-form';
import { SignatureList } from '@/components/contracts/signature-list';
import { EventsList } from './events-list';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createContractEvent } from './utils';

interface ContractsClientProps {
  initialContracts: EmploymentContract[];
  activeContract: EmploymentContract | null;
  signatures: ContractSignature[];
  allStaff: Staff[];
  events: ContractEvent[];
  loading: boolean;
}

export function ContractsClient({
  initialContracts,
  activeContract,
  signatures,
  allStaff,
  events,
  loading,
}: ContractsClientProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);

  const signedStaff = useMemo(() => {
    return signatures.map(sig => {
      const staffMember = allStaff.find(s => s.id === sig.userId);
      return { ...sig, staff: staffMember };
    });
  }, [signatures, allStaff]);

  const unsignedStaff = useMemo(() => {
    if (!activeContract) return [];
    const signedUserIds = new Set(signatures.map(s => s.userId));
    return allStaff.filter(s => s.role !== 'Admin' && !signedUserIds.has(s.id));
  }, [activeContract, signatures, allStaff]);
  
  const handleActivate = async (contractToActivate: EmploymentContract) => {
    if (!firestore || !user) return;
    setIsActivating(true);

    const batch = writeBatch(firestore);

    // 1. Deactivate the current active contract, if one exists
    if (activeContract) {
      const oldContractRef = doc(firestore, 'contracts', activeContract.id);
      batch.update(oldContractRef, { isActive: false });
       await createContractEvent(batch, firestore, user, activeContract, "Archived");
    }

    // 2. Activate the new contract
    const newContractRef = doc(firestore, 'contracts', contractToActivate.id);
    batch.update(newContractRef, { isActive: true });
    await createContractEvent(batch, firestore, user, contractToActivate, "Activated");

    try {
      await batch.commit();
      toast({
        title: 'Contract Activated',
        description: `Version ${contractToActivate.version} is now the active contract.`,
      });
    } catch (error) {
      toast({ title: 'Activation Failed', variant: 'destructive' });
    } finally {
      setIsActivating(false);
    }
  };

  const handleDeactivate = async (contractToDeactivate: EmploymentContract) => {
    if (!firestore || !user || !contractToDeactivate.isActive) return;
    setIsActivating(true);

    const batch = writeBatch(firestore);

    const contractRef = doc(firestore, 'contracts', contractToDeactivate.id);
    batch.update(contractRef, { isActive: false });
    await createContractEvent(batch, firestore, user, contractToDeactivate, "Archived");

    try {
      await batch.commit();
      toast({
        title: 'Contract Deactivated',
        description: `Version ${contractToDeactivate.version} is no longer active.`,
      });
    } catch (error) {
      toast({ title: 'Deactivation Failed', variant: 'destructive' });
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <Tabs defaultValue="overview">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
          <TabsTrigger value="new">Create New</TabsTrigger>
           <TabsTrigger value="events">Audit Log</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Active Contract Signatures</CardTitle>
                        <CardDescription>
                            {activeContract 
                                ? `Tracking signatures for "${activeContract.title}" (v${activeContract.version}).`
                                : 'No contract is currently active.'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SignatureList signedStaff={signedStaff} loading={loading} />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Signatures</CardTitle>
                        <CardDescription>Staff who have not yet signed the active contract.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unsignedStaff.length > 0 ? (
                             <ul className="space-y-2">
                                {unsignedStaff.map(staff => (
                                    <li key={staff.id} className="text-sm text-muted-foreground">{staff.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">All eligible staff have signed.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </TabsContent>
      <TabsContent value="history">
         <Card>
          <CardHeader>
            <CardTitle>Contract Version History</CardTitle>
            <CardDescription>Review all created contract versions. Only one version can be active at a time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialContracts.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{c.title}</h4>
                    <p className="text-sm text-muted-foreground">Version {c.version} - Created on {c.createdAt.toDate().toLocaleDateString()}</p>
                  </div>
                  {c.isActive ? (
                    <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeactivate(c)}
                        disabled={isActivating}
                    >
                        {isActivating ? 'Deactivating...' : 'Deactivate'}
                    </Button>
                  ) : (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleActivate(c)}
                        disabled={isActivating}
                    >
                        {isActivating ? 'Activating...' : 'Set as Active'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="new">
        <NewContractForm />
      </TabsContent>
      <TabsContent value="events">
          <EventsList events={events} loading={loading} />
      </TabsContent>
    </Tabs>
  );
}
