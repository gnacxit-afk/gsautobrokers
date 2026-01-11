
'use client';

import { useState, useMemo } from 'react';
import type { Appointment, Lead, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { AppointmentCalendar } from './components/calendar';
import { TimeSlots } from './components/time-slots';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppointmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const appointmentsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'appointments'), where('ownerId', '==', user.id));
  }, [firestore, user]);

  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const leadsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'leads'), where('ownerId', '==', user.id));
  }, [firestore, user]);

  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

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
            <CardTitle>Available Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSlots
              selectedDate={selectedDate}
              appointments={appointments || []}
              leads={leads || []}
              loading={appointmentsLoading || leadsLoading}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
