
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import type { CallRecord, Staff } from '@/lib/types';
import { AccessDenied } from '@/components/access-denied';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function CallLogsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const callsQuery = useMemo(() => {
    if (!firestore) return null;
    // Use a collectionGroup query to get all 'calls' across all 'leads'
    return query(collectionGroup(firestore, 'calls'), orderBy('startTime', 'desc'));
  }, [firestore]);

  const { data: calls, loading: callsLoading } = useCollection<CallRecord>(callsQuery);

  const staffQuery = useMemo(() => firestore ? query(collection(firestore, 'staff')) : null, [firestore]);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const staffMap = useMemo(() => new Map(staff?.map(s => [s.id, s.name])), [staff]);
  
  const loading = userLoading || callsLoading || staffLoading;

  if (userLoading) {
    return <div>Loading...</div>;
  }

  if (user?.role !== 'Admin' && user?.role !== 'Supervisor') {
    return <AccessDenied />;
  }

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Call Logs</h1>
        <p className="text-muted-foreground">A record of all inbound and outbound calls.</p>
      </div>
      <Card>
          <CardContent>
               <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Recording</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                        [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                            </TableRow>
                        ))
                     ) : calls && calls.length > 0 ? (
                        calls.map(call => (
                             <TableRow key={call.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/leads/${call.leadId}/notes`} className="hover:underline text-primary">
                                        {call.leadName || 'Unknown Lead'}
                                    </Link>
                                </TableCell>
                                <TableCell>{staffMap.get(call.agentId) || call.agentId}</TableCell>
                                <TableCell>{call.startTime ? format(call.startTime.toDate(), 'MMM d, yyyy, h:mm a') : 'N/A'}</TableCell>
                                <TableCell>{call.durationInSeconds}s</TableCell>
                                <TableCell>{call.status}</TableCell>
                                <TableCell className="text-right">
                                    {call.recordingUrl ? (
                                        <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-primary hover:text-primary/80">
                                            <PlayCircle className="h-5 w-5" />
                                        </a>
                                    ) : 'N/A'}
                                </TableCell>
                            </TableRow>
                        ))
                     ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">No call records found.</TableCell>
                        </TableRow>
                     )}
                  </TableBody>
               </Table>
          </CardContent>
      </Card>
    </main>
  );
}
