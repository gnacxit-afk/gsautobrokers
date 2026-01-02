'use client';

import { useMemo } from 'react';
import { KpiClient } from './components/kpi-client';
import { PerformanceDashboard } from './components/performance-dashboard';
import { BonusStatus } from './components/bonus-status';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Lead, Staff, KPI } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';

export default function KpiPage() {
  const firestore = useFirestore();

  const kpisDocRef = useMemo(
    () => (firestore ? doc(firestore, 'kpis', 'kpi-doc') : null),
    [firestore]
  );
  const leadsQuery = useMemo(
    () => (firestore ? collection(firestore, 'leads') : null),
    [firestore]
  );
  const staffQuery = useMemo(
    () => (firestore ? collection(firestore, 'staff') : null),
    [firestore]
  );

  const { data: kpisData, loading: kpisLoading } = useDoc<{ list: KPI[] }>(kpisDocRef);
  const { data: leadsData, loading: leadsLoading } =
    useCollection<Lead>(leadsQuery);
  const { data: staffData, loading: staffLoading } =
    useCollection<Staff>(staffQuery);

  const kpis = kpisData?.list || [];
  const leads = leadsData || [];
  const staff = staffData || [];

  const loading = kpisLoading || leadsLoading || staffLoading;

  return (
    <main className="flex-1 space-y-8">
      <div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">KPI's & Performance</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada vendedor profesional genera resultados todos los días, porque
            entiende que el éxito no se espera, se provoca.
          </p>
        </div>
        <KpiClient initialKpis={kpis} loading={loading} />
        <div className="mt-8 p-4 bg-gray-100 border border-gray-200 rounded-lg text-center">
          <p className="text-sm font-semibold text-gray-700">
            👉 “Los vendedores que ganan saben esto: sin número no hay control,
            y sin control no hay ventas.”
          </p>
        </div>
      </div>

      <div className="border-t pt-8">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bonus Status</h1>
            <p className="text-muted-foreground">
              Your sales bonus progress over the last 30 days.
            </p>
          </div>
        </div>
        <BonusStatus allLeads={leads} loading={loading} />
      </div>

      <div className="border-t pt-8">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl font-bold">Real-Time Dashboard</h1>
            <p className="text-muted-foreground">Daily performance overview.</p>
          </div>
        </div>
        <PerformanceDashboard
          allLeads={leads}
          allStaff={staff}
          loading={loading}
        />
      </div>
    </main>
  );
}
