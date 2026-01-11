
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Lead } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { AppointmentCalendar } from './components/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AppointmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const appointmentsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    // Query for appointments owned by the user, ordered by start time
    return query(
        collection(firestore, 'appointments'), 
        where('ownerId', '==', user.id),
        orderBy('startTime')
    );
  }, [firestore, user]);

  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

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

  return (
    <main className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">Appointments</h1>
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
            {appointmentsLoading ? (
                <p>Loading...</p>
            ) : appointmentsForSelectedDay.length > 0 ? (
                <div className="space-y-4">
                    {appointmentsForSelectedDay.map(apt => (
                        <div key={apt.id} className="p-4 border rounded-lg bg-slate-50">
                            <p className="font-bold">{apt.leadName}</p>
                            <p className="text-sm text-muted-foreground">
                                {format(apt.startTime.toDate(), 'p', { locale: es })}
                            </p>
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
    </main>
  );
}
