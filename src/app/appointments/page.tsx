
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Lead, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, doc, type Query, type DocumentData, type QueryConstraint } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  // State for the new appointment form
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);

  // Queries for existing data
  const staffQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const appointmentsQuery = useMemo(() => {
    if (!firestore || !user || !allStaff) return null;

    let constraints: QueryConstraint[] = [orderBy('startTime')];
    
    if (user.role === 'Broker') {
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
  }, [firestore, user, allStaff]);

  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery as Query<DocumentData> | null);
  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

  const upcomingAppointments = useMemo(() => {
    if (!appointments) return [];
    const now = new Date();
    return appointments.filter(apt => apt.startTime.toDate() >= now);
  }, [appointments]);
  
  const ownersMap = useMemo(() => {
      if (!allStaff) return new Map();
      return new Map(allStaff.map(s => [s.id, s.name]));
  }, [allStaff]);
  
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
    const finalDateTime = new Date(appointmentDate);
    finalDateTime.setUTCHours(hours, minutes);

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

  return (
    <main className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Appointments</h1>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Agenda tu cita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="lead-search">Lead</Label>
                <Command className="rounded-lg border shadow-sm">
                  <CommandInput id="lead-search" placeholder="Search for a lead..." />
                  <CommandList>
                    <CommandEmpty>No leads found.</CommandEmpty>
                    <CommandGroup>
                      {(leads || []).map((lead) => (
                        <CommandItem
                          key={lead.id}
                          value={lead.name}
                          onSelect={() => setSelectedLead(lead)}
                        >
                          {lead.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
                {selectedLead && (
                    <div className="mt-2 text-sm font-semibold text-primary p-2 bg-primary/10 rounded-md">
                        Selected: {selectedLead.name}
                    </div>
                )}
              </div>
               <div className="md:col-span-2 grid grid-cols-2 gap-4">
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
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSaveAppointment} disabled={!selectedLead || isSaving}>
                    {isSaving ? "Saving..." : "Guardar Cita"}
                </Button>
            </div>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 gap-8 items-start">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
                Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
                <p>Loading...</p>
            ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                    {upcomingAppointments.map(apt => (
                        <div key={apt.id} className="p-4 border rounded-lg bg-slate-50">
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
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center p-8">
                    No upcoming appointments scheduled.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
