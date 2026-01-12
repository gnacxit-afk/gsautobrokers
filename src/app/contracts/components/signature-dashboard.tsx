'use client';

import { useMemo } from 'react';
import type { EmploymentContract, ContractSignature, Staff } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignatureList } from './signature-list';
import { PendingSignatures } from './pending-signatures';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SignatureDashboardProps {
    activeContract: EmploymentContract | null;
    signatures: ContractSignature[];
    allStaff: Staff[];
    loading: boolean;
}

export function SignatureDashboard({ activeContract, signatures, allStaff, loading }: SignatureDashboardProps) {

    const { pendingStaff, signedStaff } = useMemo(() => {
        if (!activeContract || allStaff.length === 0) {
            return { pendingStaff: [], signedStaff: [] };
        }

        const signedIds = new Set(signatures.map(s => s.userId));
        const signed = signatures.map(sig => {
            const staffMember = allStaff.find(s => s.id === sig.userId);
            return { ...sig, staff: staffMember };
        });
        
        // Exclude Admins from the pending list as they don't sign contracts
        const staffToSign = allStaff.filter(s => s.role !== 'Admin');

        const pending = staffToSign.filter(s => !signedIds.has(s.id));

        return { pendingStaff: pending, signedStaff: signed };
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
        <Card>
            <CardHeader>
                <CardTitle>Signature Tracking</CardTitle>
                <CardDescription>
                    Tracking status for: <span className="font-bold text-primary">{activeContract.title} (v{activeContract.version})</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">Pending ({pendingStaff.length})</TabsTrigger>
                        <TabsTrigger value="signed">Signed ({signedStaff.length})</TabsTrigger>
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
                            signedStaff={signedStaff} 
                            loading={loading} 
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
