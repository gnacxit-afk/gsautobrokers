
"use client";

import { useMemo, useState } from "react";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Lead, Staff } from "@/lib/types";
import { AppointmentCalendar } from "./components/appointment-calendar";

export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch all leads
  const leadsQuery = useMemo(() => 
    firestore ? query(collection(firestore, "leads")) : null
  , [firestore]);
  const { data: allLeads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  
  // Fetch all staff
  const staffQuery = useMemo(() => 
    firestore ? collection(firestore, "staff") : null
  , [firestore]);
  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const visibleLeads = useMemo(() => {
    if (!user || !allLeads || !allStaff) return [];

    let leads: Lead[] = [];

    if (user.role === 'Admin') {
      leads = allLeads;
    } else if (user.role === 'Supervisor') {
      const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
      const visibleIds = [user.id, ...teamIds];
      leads = allLeads.filter(lead => visibleIds.includes(lead.ownerId));
    } else { // Broker
      leads = allLeads.filter(lead => lead.ownerId === user.id);
    }
    
    // Filter for appointments
    return leads.filter(lead => lead.stage === 'Citado' && lead.appointmentDate);
  }, [user, allLeads, allStaff]);

  const loading = leadsLoading || staffLoading;

  return (
    <main className="h-[calc(100vh-8rem)]">
      <AppointmentCalendar appointments={visibleLeads} loading={loading} />
    </main>
  );
}
