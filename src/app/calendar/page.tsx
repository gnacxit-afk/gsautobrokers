
'use client';

import { useMemo } from 'react';
import type { Lead, Staff } from '@/lib/types';
import { useAuthContext } from '@/lib/auth';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { AppointmentCalendar } from './components/appointment-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

export default function CalendarPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const leadIdToOpen = searchParams.get('leadId');

  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    
    // We fetch all leads with an appointment date, and filter by role on the client
    // This simplifies the query and allows supervisors to see their team's leads
    let q = query(
      collection(firestore, 'leads'),
      where('appointment.date', '!=', null)
    );
    
    return q;
  }, [firestore]);

  const staffQuery = useMemo(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const visibleLeads = useMemo(() => {
    if (!user || !leads || !staff) return [];

    if (user.role === 'Admin') {
        return leads;
    }

    if (user.role === 'Supervisor') {
        const teamIds = staff.filter(s => s.supervisorId === user.id).map(s => s.id);
        const visibleIds = [user.id, ...teamIds];
        return leads.filter(lead => visibleIds.includes(lead.ownerId));
    }
    
    if (user.role === 'Broker') {
        return leads.filter(lead => lead.ownerId === user.id);
    }

    return [];
  }, [user, leads, staff]);
  
  const loading = leadsLoading || staffLoading;
  
  const leadToAutoOpen = useMemo(() => {
    if (leadIdToOpen && !loading) {
      return leads?.find(lead => lead.id === leadIdToOpen) || null;
    }
    return null;
  }, [leadIdToOpen, leads, loading]);

  if (loading) {
      return (
          <main className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-[70vh] w-full" />
          </main>
      );
  }

  return (
    <main className="flex-1">
      <AppointmentCalendar 
        appointments={visibleLeads} 
        allStaff={staff || []}
        leadToOpen={leadToAutoOpen}
      />
    </main>
  );
}
