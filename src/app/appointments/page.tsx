
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Appointment, Lead, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Query, DocumentData, QueryConstraint } from 'firebase/firestore';
import { AppointmentCalendar } from './components/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { AppointmentDialog } from '@/components/dialogs/appointment-dialog';
import { useAuthContext } from '@/lib/auth';

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLeadForDialog, setSelectedLeadForDialog] = useState<Lead | null>(null);

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
             // If supervisor has no team, only show their own
             constraints.push(where('ownerId', '==', user.id));
        }
    }
    // For Admin, no ownerId filter is applied, showing all appointments.

    return query(collection(firestore, 'appointments'), ...constraints);
  }, [firestore, user, allStaff]);

  const leadsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    // For the dialog, we might want all leads available if admin/supervisor is booking for someone else
    // For now, let's keep it simple and only show leads owned by the user. This can be expanded.
    return query(collection(firestore, 'leads'), where('ownerId', '==', user.id));
  }, [firestore, user]);

  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery as Query<DocumentData> | null);
  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

  const appointmentsForSelectedDay = useMemo(() => {
    if (!appointments) return [];
    const selectedDayStart = new Date(selectedDate);
    selectedDayStart.setHours(0, 0, 0, 0);
    const selectedDayEnd = new Date(selectedDate);
    selectedDayEnd.setHours(23, 59, 59, 999);

    return appointments.filter(apt => {
        const aptDate = apt.startTime.toDate();
        return aptDate >= selectedDayStart && aptDate <= selectedDayEnd;
    });
  }, [appointments, selectedDate]);
  
  const ownersMap = useMemo(() => {
      if (!allStaff) return new Map();
      return new Map(allStaff.map(s => [s.id, s.name]));
  }, [allStaff]);

  const loading = appointmentsLoading || staffLoading || leadsLoading;

  return (
    <main className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Appointments</h1>
         <Button onClick={() => setIsDialogOpen(true)}>Book Appointment</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentCalendar
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              appointments={appointments || []}
            />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>
                Appointments for {format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
                <p>Loading...</p>
            ) : appointmentsForSelectedDay.length > 0 ? (
                <div className="space-y-4">
                    {appointmentsForSelectedDay.map(apt => (
                        <div key={apt.id} className="p-4 border rounded-lg bg-slate-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{apt.leadName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(apt.startTime.toDate(), 'p', { locale: es })}
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
                    No appointments scheduled for this day.
                </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        leads={leads || []}
        preselectedLead={selectedLeadForDialog}
      />
    </main>
  );
}
