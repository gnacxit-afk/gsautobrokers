
'use client';

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import type { Appointment, Staff, Lead } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, type Query, type DocumentData, deleteDoc, doc, updateDoc, addDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, formatDistanceToNow, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { NewAppointmentForm } from './components/new-appointment-form';
import { EditAppointmentDialog } from './components/edit-appointment-dialog';
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
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppointmentActions } from './components/appointment-actions';
import { addNoteEntry } from '@/lib/utils';
import { createNotification } from '@/lib/utils';

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

function AppointmentsContent() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [dateFilter, setDateFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  const preselectedLeadId = searchParams.get('leadId');

  const appointmentsQuery = useMemo(() => {
    if (!firestore || !user) return null;

    const baseQuery = collection(firestore, 'appointments');
    const constraints = [orderBy('startTime', 'asc')];
    const now = new Date();

    if (dateFilter === 'today') {
      const start = startOfDay(now);
      const end = endOfDay(now);
      constraints.unshift(where('startTime', '<=', end));
      constraints.unshift(where('startTime', '>=', start));
    } else if (dateFilter === 'upcoming') {
       constraints.unshift(where('startTime', '>=', now));
    }

    if (user.role === 'Broker') {
        constraints.unshift(where('ownerId', '==', user.id));
    } else if (ownerFilter !== 'all') {
        constraints.unshift(where('ownerId', '==', ownerFilter));
    }

    return query(baseQuery, ...constraints);
}, [firestore, dateFilter, ownerFilter, user]);

  const staffQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'staff'), orderBy('name', 'asc'));
  }, [firestore]);
  
  const allLeadsQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'leads');
  }, [firestore]);

  const { data: appointments, loading } = useCollection<Appointment>(appointmentsQuery as Query<DocumentData> | null);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: allLeads, loading: leadsLoading } = useCollection<Lead>(allLeadsQuery);
  
  const brokers = useMemo(() => staff?.filter(s => s.role === 'Broker') || [], [staff]);


  const preselectedLead = useMemo(() => {
    if (!preselectedLeadId || !allLeads) return null;
    return allLeads.find(lead => lead.id === preselectedLeadId) || null;
  }, [preselectedLeadId, allLeads]);


  const handleAppointmentAdded = () => {
    // The useCollection hook will automatically update the list.
  };

  const handleAppointmentUpdated = () => {
    setEditingAppointment(null);
  }

  const handleDelete = async (appointment: Appointment) => {
    if (!firestore || !user) return;
    
    const appointmentRef = doc(firestore, 'appointments', appointment.id);
    const leadRef = doc(firestore, 'leads', appointment.leadId);
    
    try {
        await deleteDoc(appointmentRef);
        await updateDoc(leadRef, { stage: 'En Seguimiento' });
        
        await addNoteEntry(firestore, user, appointment.leadId, `Appointment for ${format(appointment.startTime.toDate(), "d MMM yyyy, p")} was canceled by ${user.name}. Stage automatically changed to "En Seguimiento".`, 'System');

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

  const handleUpdateStage = useCallback(async (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => {
    if (!firestore || !user) return;
    const leadRef = doc(firestore, 'leads', leadId);
    const lead = allLeads?.find(l => l.id === leadId);

    if (!lead) return;
    
    const batch = writeBatch(firestore);

    try {
        batch.update(leadRef, { stage: newStage });

        const appointmentsQuery = query(collection(firestore, 'appointments'), where("leadId", "==", leadId));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
            batch.update(appointmentDoc.ref, { stage: newStage });
        });

        await batch.commit();

        let noteContent = `Stage changed from '${oldStage}' to '${newStage}' by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Stage Change');
        
        if (lead.ownerId !== user.id) {
            await createNotification(
                firestore,
                lead.ownerId,
                lead,
                `Stage for lead ${lead.name} was changed to ${newStage} by ${user.name}.`,
                user.name
            );
        }

        toast({ title: "Stage Updated", description: `Lead stage and appointment statuses changed to ${newStage}.` });
        
    } catch (error) {
         console.error("Error updating stage:", error);
         toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
    }
  }, [firestore, user, toast, allLeads]);

  const handleUpdateOwner = useCallback(async (leadId: string, newOwnerId: string) => {
    if (!firestore || !user || !staff) return;

    const leadDoc = allLeads?.find(l => l.id === leadId);
    const newOwner = staff.find(s => s.id === newOwnerId);
    if (!leadDoc || !newOwner) {
        toast({ title: "Error", description: "Lead or new owner not found.", variant: "destructive"});
        return;
    }
    const oldOwnerName = leadDoc.ownerName;

    const batch = writeBatch(firestore);
    try {
        const leadRef = doc(firestore, 'leads', leadId);
        batch.update(leadRef, { ownerId: newOwnerId, ownerName: newOwner.name });

        const appointmentsQuery = query(collection(firestore, 'appointments'), where('leadId', '==', leadId));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
            batch.update(appointmentDoc.ref, { ownerId: newOwnerId });
        });

        await batch.commit();

        const noteContent = `Owner changed from '${oldOwnerName}' to '${newOwner.name}' by ${user.name}`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Owner Change');
        
        if (newOwnerId !== user.id) {
            await createNotification(firestore, newOwnerId, leadDoc, `You have been assigned a new lead: ${leadDoc.name}.`, user.name);
        }

        const oldOwner = staff.find(s => s.name === oldOwnerName);
        if (oldOwner && oldOwner.id !== user.id) {
             await createNotification(firestore, oldOwner.id, leadDoc, `Lead ${leadDoc.name} was reassigned to ${newOwner.name}.`, user.name);
        }
        
        toast({ title: "Owner Updated", description: `${leadDoc.name} and all their appointments are now assigned to ${newOwner.name}.` });

    } catch (error) {
        console.error("Error updating owner and appointments:", error);
        toast({ title: "Error", description: "Could not update lead owner and associated appointments.", variant: "destructive"});
    }
}, [firestore, user, staff, toast, allLeads]);
  
  const selectableStaff = useMemo(() => {
    if (!user || !staff) return [];
    if (user.role === 'Admin') return staff.filter(s => s.role !== 'Admin'); // Admins can assign to anyone but other admins
    if (user.role === 'Supervisor') {
      return staff;
    }
    return [];
  }, [user, staff]);

  return (
    <>
      <main className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Appointments</h1>
        </div>

        <div className="space-y-8">
          <div>
            <NewAppointmentForm 
              onAppointmentAdded={handleAppointmentAdded} 
              preselectedLead={preselectedLead}
            />
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
                                  <SelectItem value="all">All</SelectItem>
                                  <SelectItem value="upcoming">Upcoming</SelectItem>
                                  <SelectItem value="today">Today</SelectItem>
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
                              <TableHead>Stage</TableHead>
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
                                          <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
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
                                      <TableCell className="capitalize">{apt.stage}</TableCell>
                                      <TableCell className="text-right">
                                          <AppointmentActions 
                                            appointment={apt}
                                            userRole={user!.role}
                                            allStaff={staff || []}
                                            onEdit={() => setEditingAppointment(apt)}
                                            onDelete={() => handleDelete(apt)}
                                            onUpdateStage={handleUpdateStage}
                                            onUpdateOwner={handleUpdateOwner}
                                          />
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
      {editingAppointment && (
        <EditAppointmentDialog
            appointment={editingAppointment}
            open={!!editingAppointment}
            onOpenChange={(isOpen) => !isOpen && setEditingAppointment(null)}
            onAppointmentUpdated={handleAppointmentUpdated}
        />
      )}
    </>
  );
}

export default function AppointmentsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AppointmentsContent />
        </Suspense>
    )
}
