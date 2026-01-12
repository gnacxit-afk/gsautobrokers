'use client';

import type { ContractSignature, EmploymentContract, Staff } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface SignatureListProps {
    signatures: ContractSignature[];
    contracts: EmploymentContract[];
    staff: Staff[];
    loading: boolean;
}

export function SignatureList({ signatures, contracts, staff, loading }: SignatureListProps) {
    
    const contractMap = new Map(contracts.map(c => [c.id, c.title]));

    const renderDate = (date: any) => {
        if (!date) return 'N/A';
        const jsDate = date.toDate ? date.toDate() : new Date(date);
        return format(jsDate, 'MMM d, yyyy, h:mm a');
    };
    
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Contract</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Signed On</TableHead>
                            <TableHead>IP Address</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                </TableRow>
                             ))
                        ) : signatures.length > 0 ? (
                            signatures.map((sig) => (
                                <TableRow key={sig.id}>
                                    <TableCell className="font-medium">{sig.userName}</TableCell>
                                    <TableCell>{contractMap.get(sig.contractId) || 'Unknown Contract'}</TableCell>
                                    <TableCell>{sig.contractVersion}</TableCell>
                                    <TableCell>{renderDate(sig.signedAt)}</TableCell>
                                    <TableCell className="font-mono text-xs">{sig.ipAddress}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No signatures recorded yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
