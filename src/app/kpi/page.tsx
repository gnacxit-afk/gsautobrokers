"use client";

import { useMemo } from 'react';
import { KpiClient } from "./components/kpi-client";
import { PerformanceDashboard } from "./components/performance-dashboard";
import { BonusStatus } from "./components/bonus-status";
import { useCollection, useFirestore, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Lead, Staff, KPI } from "@/lib/types";


export default function KpiPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const kpisQuery = useMemo(() => firestore ? collection(firestore, 'kpis') : null, [firestore]);
  const leadsQuery = useMemo(() => firestore ? collection(firestore, 'leads') : null, [firestore]);
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);

  const { data: kpisData, loading: kpisLoading } = useCollection<KPI>(kpisQuery);
  const { data: leadsData, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  const { data: staffData, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const kpis = kpisData || [];
  const leads = leadsData || [];
  const staff = staffData || [];

  const loading = kpisLoading || leadsLoading || staffLoading;

  return (
    <main className="flex-1 space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl font-bold">KPI's & Performance</h1>
              <p className="text-muted-foreground">Metas de desempeño diario para vendedores.</p>
          </div>
        </div>
        <KpiClient initialKpis={kpis} loading={loading} />
        <div className="mt-8 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-sm font-semibold text-gray-700">👉 Si no hay número, NO cuenta como lead de trabajado.</p>
        </div>
      </div>
      
       <div className="border-t pt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold">Bonus Status</h1>
                <p className="text-muted-foreground">Your sales bonus progress over the last 30 days.</p>
            </div>
          </div>
          <BonusStatus allLeads={leads} loading={loading} />
      </div>

      <div className="border-t pt-8">
         <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl font-bold">Real-Time Dashboard</h1>
              <p className="text-muted-foreground">Daily performance overview.</p>
          </div>
        </div>
        <PerformanceDashboard allLeads={leads} allStaff={staff} loading={loading} />
      </div>

    </main>
  );
}
