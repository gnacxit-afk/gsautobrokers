
'use client';

import { useMemo, useState } from 'react';
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
  const [selectedUserId, setSelectedUserId] = useState('all');

  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'leads'),
      where('appointment.date', '!=', null)
    );
  }, [firestore]);

  const staffQuery = useMemo(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const visibleLeads = useMemo(() => {
    if (!user || !leads || !staff) return [];
    
    let userLeads = leads;

    if (user.role === 'Supervisor') {
        const teamIds = staff.filter(s => s.supervisorId === user.id).map(s => s.id);
        const visibleIds = [user.id, ...teamIds];
        userLeads = leads.filter(lead => visibleIds.includes(lead.ownerId));
    } else if (user.role === 'Broker') {
        userLeads = leads.filter(lead => lead.ownerId === user.id);
    }
    
    if (selectedUserId !== 'all') {
        return userLeads.filter(lead => lead.ownerId === selectedUserId);
    }
    
    return userLeads;

  }, [user, leads, staff, selectedUserId]);
  
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
       <div className="mb-6">
        <h1 className="text-2xl font-bold">Agenda de Citas</h1>
        <p className="text-muted-foreground">
          Gestiona y prioriza las citas programadas.
        </p>
      </div>
      <AppointmentCalendar 
        appointments={visibleLeads} 
        allStaff={staff || []}
        leadToOpen={leadToAutoOpen}
        visibleLeads={visibleLeads}
        onUserFilterChange={setSelectedUserId}
        selectedUserId={selectedUserId}
      />
    </main>
  );
}
