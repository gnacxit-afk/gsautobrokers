
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, type Query, type DocumentData } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { NewAppointmentForm } from './components/new-appointment-form';
import { useAuthContext } from '@/lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();

  // Default to showing upcoming appointments to avoid timezone issues with 'today'
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const appointmentsQuery = useMemo(() => {
    if (!firestore) return null;

    const constraints = [];
    
    // Date filtering
    const now = new Date();
    if (dateFilter === 'today') {
      const start = startOfDay(now);
      const end = endOfDay(now);
      constraints.push(where('startTime', '>=', start));
      constraints.push(where('startTime', '<=', end));
    } else if (dateFilter === 'upcoming') {
       constraints.push(where('startTime', '>=', now));
    }

    // Owner filtering based on role
    if (user) {
        if (ownerFilter !== 'all') {
            constraints.push(where('ownerId', '==', ownerFilter));
        } else {
             if (user.role === 'Broker') {
                constraints.push(where('ownerId', '==', user.id));
             } else if (user.role === 'Supervisor') {
                // In a real app, this would require fetching the supervisor's team, which adds complexity.
                // For now, supervisors see all, or can filter to a specific user.
             }
        }
    }
    
    constraints.push(orderBy('startTime', 'asc'));

    return query(collection(firestore, 'appointments'), ...constraints);
  }, [firestore, dateFilter, ownerFilter, user]);

  const staffQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'staff'), orderBy('name', 'asc'));
  }, [firestore]);


  const { data: appointments, loading } = useCollection<Appointment>(appointmentsQuery as Query<DocumentData> | null);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const handleAppointmentAdded = () => {
    // The useCollection hook will automatically update the list.
    // This function can be used for any additional logic after creation.
  };
  
  const selectableStaff = useMemo(() => {
    if (!user || !staff) return [];
    if (user.role === 'Admin') return staff;
    if (user.role === 'Supervisor') {
      // In a real app, you'd filter this list to just the supervisor's team.
      return staff;
    }
    return [];
  }, [user, staff]);

  return (
    <main className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
      </div>

      <div className="space-y-8">
        <div>
          <NewAppointmentForm onAppointmentAdded={handleAppointmentAdded} />
        </div>
        <div>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Scheduled Appointments</CardTitle>
                    <div className="flex items-center gap-4 pt-2">
                         <Select onValueChange={setDateFilter} value={dateFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="all">All</SelectItem>
                            </SelectContent>
                        </Select>
                        {(user?.role === 'Admin' || user?.role === 'Supervisor') && selectableStaff.length > 0 && (
                             <Select onValueChange={setOwnerFilter} value={ownerFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by owner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Owners</SelectItem>
                                    {selectableStaff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                    </TableRow>
                                ))
                            ) : appointments && appointments.length > 0 ? (
                                appointments.map((apt) => (
                                    <TableRow key={apt.id}>
                                    <TableCell className="font-medium">{apt.leadName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{format(apt.startTime.toDate(), "d 'de' MMMM, yyyy", { locale: es })}</span>
                                            <span className="text-xs text-muted-foreground">{format(apt.startTime.toDate(), "p", { locale: es })} ({formatDistanceToNow(apt.startTime.toDate(), { addSuffix: true, locale: es })})</span>
                                        </div>
                                    </TableCell>
                                     <TableCell>{staff?.find(s => s.id === apt.ownerId)?.name || 'Unknown'}</TableCell>
                                    <TableCell className="capitalize">{apt.status}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No appointments found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  );
}
