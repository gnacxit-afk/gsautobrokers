
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Lead, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, type Query, type DocumentData, type QueryConstraint, endAt, startAt } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  // State for the new appointment form
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for filters
  const [filterOwnerId, setFilterOwnerId] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [filterEndDate, setFilterEndDate] = useState(format(endOfDay(new Date()), 'yyyy-MM-dd'));


  // Queries for existing data
  const staffQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const appointmentsQuery = useMemo(() => {
    if (!firestore || !user || !allStaff) return null;

    const startDate = new Date(filterStartDate + 'T00:00:00');
    const endDate = new Date(filterEndDate + 'T23:59:59');

    let constraints: QueryConstraint[] = [
        orderBy('startTime'),
        startAt(startDate),
        endAt(endDate),
    ];
    
    // Filter by specific owner if selected
    if (filterOwnerId !== 'all') {
        constraints.push(where('ownerId', '==', filterOwnerId));
    }
    // Role-based filtering if no specific owner is selected
    else if (user.role === 'Broker') {
        constraints.push(where('ownerId', '==', user.id));
    } else if (user.role === 'Supervisor') {
        const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
        const visibleIds = [user.id, ...teamIds];
        if (visibleIds.length > 0) {
            constraints.push(where('ownerId', 'in', visibleIds));
        } else {
             constraints.push(where('ownerId', '==', user.id));
        }
    }

    return query(collection(firestore, 'appointments'), ...constraints);
  }, [firestore, user, allStaff, filterOwnerId, filterStartDate, filterEndDate]);

  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery as Query<DocumentData> | null);
  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  
  const ownersMap = useMemo(() => {
      if (!allStaff) return new Map();
      return new Map(allStaff.map(s => [s.id, s.name]));
  }, [allStaff]);

  const leadsMap = useMemo(() => {
    if (!leads) return new Map();
    return new Map(leads.map(l => [l.id, l]));
  }, [leads]);
  
  const handleSaveAppointment = async () => {
    if (!firestore || !user || !selectedLead || !appointmentDate || !appointmentTime) {
      toast({
        title: 'Error',
        description: 'Please select a lead, date, and time.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const finalDateTime = new Date(appointmentDate + 'T00:00:00');
    finalDateTime.setHours(hours, minutes);

    try {
      const appointmentsCollection = collection(firestore, 'appointments');
      await addDoc(appointmentsCollection, {
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        startTime: finalDateTime,
        endTime: addMinutes(finalDateTime, 30),
        ownerId: selectedLead.ownerId,
        status: selectedLead.stage === 'Ganado' || selectedLead.stage === 'Calificado' ? 'Hot' : 'Warm',
      });
      
      const leadRef = doc(firestore, 'leads', selectedLead.id);
      await updateDoc(leadRef, { stage: 'Citado' });

      await addDoc(collection(firestore, 'leads', selectedLead.id, 'noteHistory'), {
          content: `Appointment scheduled by ${user.name} for ${format(finalDateTime, "eeee, d 'de' MMMM 'at' p", { locale: es })}.`,
          author: 'System',
          date: serverTimestamp(),
          type: 'System',
      });

      toast({
        title: 'Appointment Booked!',
        description: `Appointment with ${selectedLead.name} has been saved.`,
      });

      // Reset form
      setSelectedLead(null);
      setAppointmentDate(format(new Date(), 'yyyy-MM-dd'));
      setAppointmentTime('09:00');

    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loading = appointmentsLoading || staffLoading || leadsLoading;
  const selectableStaff = allStaff?.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin') || [];

  return (
    <main className="flex-1 space-y-6">
       <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Agenda tu cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lead-select">Lead</Label>
                <Select
                  onValueChange={(leadId) => {
                    const lead = leads?.find(l => l.id === leadId);
                    setSelectedLead(lead || null);
                  }}
                  value={selectedLead?.id || ''}
                >
                <SelectTrigger id="lead-select">
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leadsLoading ? <div className="p-4 text-center text-sm">Loading leads...</div> :
                    (leads || []).map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="date">Appointment Date</Label>
                      <Input 
                          id="date"
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="time">Appointment Time</Label>
                      <Input 
                          id="time"
                          type="time"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                      />
                  </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveAppointment} disabled={!selectedLead || isSaving}>
                    {isSaving ? "Saving..." : "Guardar Cita"}
                </Button>
            </div>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {user?.role === 'Admin' && (
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter upcoming appointments by date range and owner.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="owner-filter">Owner</Label>
                    <Select onValueChange={setFilterOwnerId} value={filterOwnerId}>
                      <SelectTrigger id="owner-filter">
                        <SelectValue placeholder="Filter by Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {selectableStaff.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date-filter">Start Date</Label>
                  <Input
                    id="start-date-filter"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date-filter">End Date</Label>
                  <Input
                    id="end-date-filter"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={user?.role === 'Admin' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>
                  Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
              ) : appointments && appointments.length > 0 ? (
                  <div className="space-y-4">
                      {appointments.map(apt => {
                          const lead = leadsMap.get(apt.leadId);
                          const stage = lead?.stage;
                          
                          const itemClasses = cn("p-4 border rounded-lg transition-colors cursor-pointer", {
                            'bg-green-50 hover:bg-green-100 border-green-200': stage === 'Ganado',
                            'bg-red-50 hover:bg-red-100 border-red-200': stage === 'Perdido',
                            'bg-amber-50 hover:bg-amber-100 border-amber-200': stage === 'Citado' || stage === 'En Seguimiento',
                            'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-200': !stage || (stage !== 'Ganado' && stage !== 'Perdido' && stage !== 'Citado' && stage !== 'En Seguimiento'),
                          });

                          return (
                            <Link href={`/leads/${apt.leadId}/notes`} key={apt.id}>
                                <div className={itemClasses}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">{apt.leadName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(apt.startTime.toDate(), "eeee, d MMM 'at' p", { locale: es })}
                                            </p>
                                        </div>
                                        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                                            <p className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                                                {ownersMap.get(apt.ownerId) || 'Unknown Owner'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                          );
                      })}
                  </div>
              ) : (
                  <p className="text-muted-foreground text-center p-8">
                      No appointments found for the selected filters.
                  </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
