
'use client';

import { useMemo } from 'react';
import type { Lead, Staff } from '@/lib/types';
import { useAuthContext } from '@/lib/auth';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { AppointmentCalendar } from './components/appointment-calendar';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();

  const leadsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    
    let q = query(
      collection(firestore, 'leads'),
      where('stage', '==', 'Citado'),
      where('appointmentDate', '!=', null)
    );
    
    // Brokers only see their own leads. Supervisors and Admins see more.
    if (user.role === 'Broker') {
      q = query(q, where('ownerId', '==', user.id));
    }
    
    return q;
  }, [firestore, user]);

  const staffQuery = useMemo(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  // For supervisors, we need to fetch their team members to filter leads client-side
  const visibleLeads = useMemo(() => {
    if (!user || !leads || !staff) return [];

    if (user.role === 'Admin' || user.role === 'Broker') {
        return leads;
    }

    if (user.role === 'Supervisor') {
        const teamIds = staff.filter(s => s.supervisorId === user.id).map(s => s.id);
        const visibleIds = [user.id, ...teamIds];
        return leads.filter(lead => visibleIds.includes(lead.ownerId));
    }

    return [];
  }, [user, leads, staff]);
  
  const loading = leadsLoading || staffLoading;

  if (loading) {
      return (
          <main className="flex-1 space-y-4">
              <Skeleton className="h-10 w-48 mb-4" />
              <Skeleton className="h-[70vh] w-full" />
          </main>
      );
  }

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Appointment Calendar</h1>
        <p className="text-muted-foreground">
          View and manage scheduled appointments.
        </p>
      </div>
      <AppointmentCalendar appointments={visibleLeads} allStaff={staff || []} />
    </main>
  );
}
