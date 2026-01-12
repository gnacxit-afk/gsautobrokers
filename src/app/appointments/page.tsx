
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, type Query, type DocumentData, deleteDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
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
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const handleDelete = async (appointment: Appointment) => {
    if (!firestore || !user) return;
    
    const appointmentRef = doc(firestore, 'appointments', appointment.id);
    const leadRef = doc(firestore, 'leads', appointment.leadId);
    const noteHistoryRef = collection(firestore, 'leads', appointment.leadId, 'noteHistory');

    try {
        await deleteDoc(appointmentRef);
        await updateDoc(leadRef, { stage: 'En Seguimiento' });
        
        await addDoc(noteHistoryRef, {
            content: `Appointment for ${format(appointment.startTime.toDate(), "d MMM yyyy, p")} was canceled. Stage automatically changed to "En Seguimiento".`,
            author: 'System',
            date: serverTimestamp(),
            type: 'System',
        });

        toast({
            title: 'Appointment Canceled',
            description: `The appointment for ${appointment.leadName} has been removed.`,
        });

    } catch (error: any) {
        toast({
            title: 'Error',
            description: 'Could not cancel the appointment.',
            variant: 'destructive',
        });
    }
  }
  
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
                            <TableHead className="text-right">Actions</TableHead>
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
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : appointments && appointments.length > 0 ? (
                                appointments.map((apt) => (
                                    <TableRow key={apt.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/leads/${apt.leadId}/notes`} className="hover:underline">
                                            {apt.leadName}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{format(apt.startTime.toDate(), "d 'de' MMMM, yyyy", { locale: es })}</span>
                                            <span className="text-xs text-muted-foreground">{format(apt.startTime.toDate(), "p", { locale: es })} ({formatDistanceToNow(apt.startTime.toDate(), { addSuffix: true, locale: es })})</span>
                                        </div>
                                    </TableCell>
                                     <TableCell>{staff?.find(s => s.id === apt.ownerId)?.name || 'Unknown'}</TableCell>
                                    <TableCell className="capitalize">{apt.status}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                    <Trash2 size={16}/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will cancel the appointment for <span className="font-bold">{apt.leadName}</span> and change the lead's stage to "En Seguimiento".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(apt)} className="bg-destructive hover:bg-destructive/90">
                                                        Yes, cancel appointment
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
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
