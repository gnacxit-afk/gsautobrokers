'use client';

import { useMemo, useState } from 'react';
import { KpiClient } from './components/kpi-client';
import { PerformanceDashboard } from './components/performance-dashboard';
import { BonusStatus } from './components/bonus-status';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { Lead, Staff, KPI } from '@/lib/types';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_KPIS: KPI[] = [
    { id: 'leads_recibidos', label: 'Leads recibidos', target: 'informativo', description: 'Total de leads que ingresan al sistema.' },
    { id: 'numeros_obtenidos', label: 'Números obtenidos', target: '5 mínimos', description: 'Cantidad de números de teléfono válidos conseguidos.' },
    { id: 'citas_agendadas', label: 'Citas agendadas', target: '3 mínimas', description: 'Cantidad de citas programadas con los leads.' },
    { id: 'citas_confirmadas', label: 'Citas confirmadas', target: '2+', description: 'Citas que han sido confirmadas por el lead.' },
    { id: 'leads_descartados', label: 'Leads descartados', target: 'permitido', description: 'Leads que han sido correctamente calificados y descartados.' },
    { id: 'ventas', label: 'Ventas', target: '3', description: 'Número de ventas cerradas.' },
];


export default function KpiPage() {
  const firestore = useFirestore();
  const { user, MASTER_ADMIN_EMAIL } = useAuthContext();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

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
  
  const handleInitializeKpis = async () => {
    if (!firestore || !kpisDocRef) return;
    setIsInitializing(true);
    try {
        await setDoc(kpisDocRef, { list: DEFAULT_KPIS });
        toast({ title: 'KPIs Initialized', description: 'Default KPI data has been saved.' });
    } catch (error: any) {
        toast({ title: 'Initialization Failed', description: error.message, variant: 'destructive'});
    } finally {
        setIsInitializing(false);
    }
  }

  return (
    <main className="flex-1 space-y-8">
      <div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Daily Goals</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada vendedor profesional genera resultados todos los días, porque
            entiende que el éxito no se espera, se provoca.
          </p>
        </div>
        
        {user?.email === MASTER_ADMIN_EMAIL && !kpisData && !kpisLoading && (
            <div className="text-center my-6">
                <p className="mb-2 text-muted-foreground">KPI data not found.</p>
                <Button onClick={handleInitializeKpis} disabled={isInitializing}>
                    {isInitializing ? 'Initializing...' : 'Initialize KPIs'}
                </Button>
            </div>
        )}

        <KpiClient initialKpis={kpis} loading={kpisLoading} />

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
