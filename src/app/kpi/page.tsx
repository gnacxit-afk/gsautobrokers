'use client';

import { useMemo } from 'react';
import { KpiClient } from './components/kpi-client';
import { PerformanceDashboard } from './components/performance-dashboard';
import { BonusStatus } from './components/bonus-status';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Lead, Staff, KPI } from '@/lib/types';

// Hardcoded KPIs as a temporary measure
const hardcodedKpis: KPI[] = [
    { id: "1", label: "📩 Leads recibidos", target: "informativo", description: "Total de leads recibidos en el día." },
    { id: "2", label: "📞 Números obtenidos", target: "5 mínimos", description: "Cantidad de números de teléfono válidos obtenidos." },
    { id: "3", label: "📅 Citas agendadas", target: "3 mínimas", description: "Cantidad de citas agendadas para demostración o prueba de manejo." },
    { id: "4", label: "✅ Citas confirmadas", target: "2+", description: "Citas que han sido confirmadas por el cliente." },
    { id: "5", label: "🚫 Leads descartados", target: "permitido", description: "Leads que han sido correctamente calificados y descartados." },
    { id: "6", label: "💸 Ventas", target: "3", description: "Cantidad de ventas cerradas." }
];


export default function KpiPage() {
  const firestore = useFirestore();

  // We are using hardcoded KPIs for now, but keep fetching other data
  const leadsQuery = useMemo(
    () => (firestore ? collection(firestore, 'leads') : null),
    [firestore]
  );
  const staffQuery = useMemo(
    () => (firestore ? collection(firestore, 'staff') : null),
    [firestore]
  );

  const { data: leadsData, loading: leadsLoading } =
    useCollection<Lead>(leadsQuery);
  const { data: staffData, loading: staffLoading } =
    useCollection<Staff>(staffQuery);

  const leads = leadsData || [];
  const staff = staffData || [];

  // KPI data is now coming from the hardcoded list.
  const kpis = hardcodedKpis;
  const kpisLoading = false; 

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
