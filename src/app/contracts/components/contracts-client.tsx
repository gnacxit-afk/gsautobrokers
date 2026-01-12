'use client';

import React, { useState } from 'react';
import type { EmploymentContract, ContractSignature, Staff, ContractEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ContractList } from './contract-list';
import { ContractEditor } from './contract-editor';
import { SignatureDashboard } from './signature-dashboard';
import { ContractHistory } from './contract-history';

interface ContractsClientProps {
    initialContracts: EmploymentContract[];
    activeContract: EmploymentContract | null;
    signatures: ContractSignature[];
    allStaff: Staff[];
    events: ContractEvent[];
    loading: boolean;
}

export function ContractsClient({ initialContracts, activeContract, signatures, allStaff, events, loading }: ContractsClientProps) {
    const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleSelectContract = (contract: EmploymentContract) => {
        setSelectedContract(contract);
        setIsEditing(true);
    };

    const handleStartNew = () => {
        setSelectedContract(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedContract(null);
    }
    
    const handleSave = () => {
        setIsEditing(false);
        setSelectedContract(null);
        // The useCollection hooks will automatically refresh the list
    }

    if (isEditing) {
        return (
            <ContractEditor
                contract={selectedContract}
                onCancel={handleCancel}
                onSave={handleSave}
            />
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Contract Templates</h2>
                        <Button onClick={handleStartNew}>
                            <Plus className="mr-2 h-4 w-4" /> New Contract
                        </Button>
                    </div>
                    <ContractList
                        contracts={initialContracts}
                        loading={loading}
                        onEdit={handleSelectContract}
                    />
                </div>
                
                 <div>
                    <h2 className="text-xl font-semibold mb-4">Signature Status</h2>
                     <SignatureDashboard
                        activeContract={activeContract}
                        signatures={signatures}
                        allStaff={allStaff}
                        loading={loading}
                    />
                </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
                 <div>
                    <h2 className="text-xl font-semibold mb-4">Contract History</h2>
                    <ContractHistory events={events} loading={loading} />
                </div>
            </div>
        </div>
    );
}
