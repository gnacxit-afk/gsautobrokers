'use client';

import type { ContractEvent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventsListProps {
    events: ContractEvent[];
    loading: boolean;
}

const eventColors: Record<ContractEvent['eventType'], string> = {
    Created: 'bg-blue-100 text-blue-800',
    Activated: 'bg-green-100 text-green-800',
    Archived: 'bg-slate-100 text-slate-800'
};

export function EventsList({ events, loading }: EventsListProps) {

    const renderDate = (date: any) => {
        if (!date) return 'N/A';
        const jsDate = date.toDate ? date.toDate() : new Date(date);
        return format(jsDate, 'MMM d, yyyy, h:mm a');
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contract Audit Log</CardTitle>
                <CardDescription>A log of all major contract management events.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Contract</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Timestamp</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                </TableRow>
                             ))
                        ) : events.length > 0 ? (
                            events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        <Badge className={cn(eventColors[event.eventType])}>{event.eventType}</Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{event.contractTitle} (v{event.contractVersion})</TableCell>
                                    <TableCell>{event.userName}</TableCell>
                                    <TableCell>{renderDate(event.timestamp)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No audit events found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
