'use client';

import React, { useState, useMemo } from 'react';
import type { EmploymentContract, ContractSignature } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { FileWarning, Check } from 'lucide-react';
import { ContractSigningModal } from './contract-signing-modal';

export function ContractSigningBanner() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 1. Find the currently active contract
    const activeContractQuery = useMemo(() => 
        firestore 
            ? query(collection(firestore, 'contracts'), where('isActive', '==', true))
            : null
    , [firestore]);
    const { data: activeContracts, loading: contractsLoading } = useCollection<EmploymentContract>(activeContractQuery);
    const activeContract = useMemo(() => (activeContracts && activeContracts.length > 0 ? activeContracts[0] : null), [activeContracts]);

    // 2. Check if the current user has already signed THIS active contract
    const signatureQuery = useMemo(() => {
        if (!firestore || !user || !activeContract) return null;
        return query(
            collection(firestore, 'signatures'),
            where('userId', '==', user.id),
            where('contractId', '==', activeContract.id)
        );
    }, [firestore, user, activeContract]);
    const { data: signatures, loading: signaturesLoading } = useCollection<ContractSignature>(signatureQuery);

    const hasSigned = useMemo(() => (signatures && signatures.length > 0), [signatures]);
    
    const loading = userLoading || contractsLoading || signaturesLoading;
    
    if (loading || !user || !activeContract || hasSigned || user.role === 'Admin') {
        return null; // Don't show if loading, no active contract, already signed, or is an admin
    }

    return (
        <>
            <div className="sticky top-0 z-40 bg-yellow-400 text-yellow-900 p-3 shadow-md mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileWarning className="h-5 w-5" />
                    <p className="text-sm font-medium">
                        You have a new employment contract that requires your signature.
                    </p>
                </div>
                <Button 
                    variant="ghost" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    onClick={() => setIsModalOpen(true)}
                >
                    Review and Sign
                </Button>
            </div>
            <ContractSigningModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contract={activeContract}
            />
        </>
    );
}
