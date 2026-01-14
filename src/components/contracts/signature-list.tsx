
'use client';

import type { ContractSignature, Staff } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import Link from 'next/link';

interface SignedStaff extends ContractSignature {
    staff?: Staff;
}

interface SignatureListProps {
    signedStaff: SignedStaff[];
    loading: boolean;
}

export function SignatureList({ signedStaff, loading }: SignatureListProps) {

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
                                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                </TableRow>
                             ))
                        ) : signedStaff.length > 0 ? (
                            signedStaff.map((sig) => (
                                <TableRow key={sig.id}>
                                    <TableCell className="font-medium">
                                        {sig.staff ? (
                                            <Link href={`/crm/staff/${sig.staff.id}`} className="hover:underline text-primary">
                                                {sig.userName}
                                            </Link>
                                        ) : (
                                            sig.userName
                                        )}
                                    </TableCell>
                                    <TableCell>{sig.contractVersion}</TableCell>
                                    <TableCell>{renderDate(sig.signedAt)}</TableCell>
                                    <TableCell className="font-mono text-xs">{sig.ipAddress}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No signatures recorded for this contract yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

    