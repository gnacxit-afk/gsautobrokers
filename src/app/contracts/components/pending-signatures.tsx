'use client';

import type { Staff } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PendingSignaturesProps {
    pendingStaff: Staff[];
    loading: boolean;
    contractTitle: string;
}

export function PendingSignatures({ pendingStaff, loading, contractTitle }: PendingSignaturesProps) {
    const firestore = useFirestore();
    const { user: currentUser } = useUser();
    const { toast } = useToast();

    const handleSendReminder = async (staffMember: Staff) => {
        if (!firestore || !currentUser) {
            toast({ title: "Error", description: "Could not send reminder.", variant: "destructive" });
            return;
        }

        try {
            const notificationsCollection = collection(firestore, 'notifications');
            await addDoc(notificationsCollection, {
                userId: staffMember.id,
                content: `Reminder: Please review and sign the contract "${contractTitle}".`,
                author: currentUser.name,
                createdAt: serverTimestamp(),
                read: false,
            });
            toast({ title: "Reminder Sent", description: `A notification has been sent to ${staffMember.name}.` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to send reminder.", variant: "destructive" });
        }
    };
    
    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                                </TableRow>
                             ))
                        ) : pendingStaff.length > 0 ? (
                            pendingStaff.map((staff) => (
                                <TableRow key={staff.id}>
                                    <TableCell className="font-medium">{staff.name}</TableCell>
                                    <TableCell>{staff.role}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => handleSendReminder(staff)}>
                                            <Send className="mr-2 h-3 w-3" />
                                            Send Reminder
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    All relevant staff have signed this contract.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
