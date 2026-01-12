'use client';

import { useMemo } from 'react';
import type { EmploymentContract, ContractSignature, Staff } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignatureList } from './signature-list';
import { PendingSignatures } from './pending-signatures';

interface SignatureDashboardProps {
    activeContract: EmploymentContract | null;
    signatures: ContractSignature[];
    allStaff: Staff[];
    loading: boolean;
}

export function SignatureDashboard({ activeContract, signatures, allStaff, loading }: SignatureDashboardProps) {

    const { signedStaffIds, pendingStaff } = useMemo(() => {
        if (!activeContract || allStaff.length === 0) {
            return { signedStaffIds: new Set<string>(), pendingStaff: [] };
        }

        const signedIds = new Set(signatures.map(s => s.userId));
        
        // Exclude Admins from the pending list as they don't sign contracts
        const staffToSign = allStaff.filter(s => s.role !== 'Admin');

        const pending = staffToSign.filter(s => !signedIds.has(s.id));

        return { signedStaffIds, pendingStaff: pending };
    }, [activeContract, signatures, allStaff]);


    if (loading) {
        return <p>Loading signature data...</p>;
    }
    
    if (!activeContract) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-slate-50">
                <p>There is no active contract set. Please set a contract template to "Active" to track signatures.</p>
            </div>
        )
    }

    return (
        <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending ({pendingStaff.length})</TabsTrigger>
                <TabsTrigger value="signed">Signed ({signatures.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                <PendingSignatures 
                    pendingStaff={pendingStaff}
                    loading={loading}
                    contractTitle={activeContract.title}
                />
            </TabsContent>
            <TabsContent value="signed">
                <SignatureList 
                    signatures={signatures} 
                    loading={loading} 
                />
            </TabsContent>
        </Tabs>
    );
}
