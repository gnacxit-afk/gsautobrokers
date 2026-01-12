
'use client';

import { useMemo, useState, useEffect } from 'react';
import { KpiClient } from './components/kpi-client';
import { PerformanceDashboard } from './components/performance-dashboard';
import { BonusStatus } from './components/bonus-status';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import type { Lead, Staff, KPI } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useDateRange } from '@/hooks/use-date-range';
import { calculateBonus } from '@/lib/utils';
import { COMMISSION_PER_VEHICLE } from '@/lib/mock-data';
import { isWithinInterval, isValid } from 'date-fns';
import { DateRangePicker } from '@/components/layout/date-range-picker';

const DEFAULT_KPIS: KPI[] = [
    { id: 'leads_recibidos', label: 'Leads recibidos', target: 'informativo', description: 'Total de leads que ingresan al sistema.' },
    { id: 'numeros_obtenidos', label: 'Números obtenidos', target: '5 mínimos', description: 'Cantidad de números de teléfono válidos conseguidos.' },
    { id: 'citas_agendadas', label: 'Citas agendadas', target: '3 mínimas', description: 'Cantidad de citas programadas con los leads.' },
    { id: 'citas_confirmadas', label: 'Citas confirmadas', target: '2+', description: 'Citas que han sido confirmadas por el lead.' },
    { id: 'leads_descartados', label: 'Leads descartados', target: 'permitido', description: 'Leads que han sido correctamente calificados y descartados.' },
    { id: 'ventas', label: 'Ventas', target: '3', description: 'Número de ventas cerradas.' },
];

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => {
  const colors: { [key: string]: string } = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color] || colors.blue} shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

function BrokerGoalsView({kpis, kpisLoading, allLeads, staff, loading}) {
  const { user } = useUser();
  const { dateRange } = useDateRange();
  
  const brokerStats = useMemo(() => {
    if (!user || user.role !== 'Broker' || !allLeads) {
      return null;
    }

    const brokerLeads = allLeads.filter(l => {
        const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
        if (isNaN(leadDate.getTime())) return false;
        return l.ownerId === user.id && isWithinInterval(leadDate, dateRange);
    });
      
    const totalLeads = brokerLeads.length;
    const closedSales = brokerLeads.filter(l => l.stage === 'Ganado').length;
    const conversion = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;
    const totalCommissions = closedSales * COMMISSION_PER_VEHICLE;
    const brokerBonus = calculateBonus(closedSales);

    return {
      totalLeads,
      closedSales,
      conversion,
      totalCommissions,
      brokerBonus
    };
  }, [user, allLeads, dateRange]);
  
  const performanceLeads = useMemo(() => {
    return allLeads.filter(l => {
        if (!l.createdAt) return false;
        const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
        if (!isValid(leadDate)) return false;
        return isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [allLeads, dateRange]);


  if (!brokerStats) return null;

  return (
    <main className="flex-1 space-y-8">
      <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mis Metas</h1>
            <p className="text-muted-foreground">Tu rendimiento para el período seleccionado.</p>
          </div>
          <DateRangePicker />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Leads" value={brokerStats.totalLeads} color="blue" />
            <StatCard label="Ventas Cerradas" value={brokerStats.closedSales} color="green" />
            <StatCard label="Conversión" value={`${brokerStats.conversion.toFixed(1)}%`} color="indigo" />
            <StatCard label="Comisiones" value={`$${brokerStats.totalCommissions.toLocaleString()}`} color="amber" />
            <StatCard label="Bono" value={`$${brokerStats.brokerBonus.toLocaleString()}`} color="violet" />
        </div>
      </div>
      
       <div className="border-t pt-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Daily Goals</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada vendedor profesional genera resultados todos los días, porque
              entiende que el éxito no se espera, se provoca.
            </p>
          </div>
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
              <h1 className="text-2xl font-bold">Estado de Bonos</h1>
              <p className="text-muted-foreground">
                Tu progreso de bonos por ventas en los últimos 30 días.
              </p>
            </div>
          </div>
          <BonusStatus allLeads={allLeads} loading={loading} />
        </div>

        <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard en Tiempo Real</h1>
                    <p className="text-muted-foreground">Resumen del rendimiento diario.</p>
                </div>
            </div>
            <PerformanceDashboard
                allLeads={performanceLeads}
                allStaff={staff}
                loading={loading}
            />
        </div>
    </main>
  )
}

function KpiPage() {
  const firestore = useFirestore();
  const { user, MASTER_ADMIN_EMAIL } = useAuthContext();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const { dateRange, setDateRange } = useDateRange();

  const kpisDocRef = useMemo(() => firestore ? doc(firestore, 'kpis', 'kpi-doc') : null, [firestore]);
  const { data: kpisData, loading: kpisLoading } = useDoc<{list: KPI[]}>(kpisDocRef);

  const leadsQuery = useMemo(() => firestore ? collection(firestore, 'leads') : null, [firestore]);
  const { data: leadsData, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staffData, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const kpis = kpisData?.list || [];
  const allLeads = leadsData || [];
  const staff = staffData || [];

  const loading = kpisLoading || leadsLoading || staffLoading;

  const performanceLeads = useMemo(() => {
    return allLeads.filter(l => {
        if (!l.createdAt) return false;
        const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
        if (!isValid(leadDate)) return false;
        return isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [allLeads, dateRange]);
  
  const handleInitializeKpis = async () => {
    if (!firestore) return;
    const kpisDocRef = doc(firestore, 'kpis', 'kpi-doc');
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

  if (user?.role === 'Broker') {
    return (
        <BrokerGoalsView 
            kpis={kpis}
            kpisLoading={kpisLoading}
            allLeads={allLeads}
            staff={staff}
            loading={loading}
        />
    )
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
            <h1 className="text-2xl font-bold">Estado de Bonos</h1>
            <p className="text-muted-foreground">
              Progreso de bonos por ventas en los últimos 30 días.
            </p>
          </div>
        </div>
        <BonusStatus allLeads={allLeads} loading={loading} />
      </div>

        <div className="border-t pt-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard en Tiempo Real</h1>
                    <p className="text-muted-foreground">Resumen de rendimiento para el período seleccionado.</p>
                </div>
                <DateRangePicker />
            </div>
            <PerformanceDashboard
                allLeads={performanceLeads}
                allStaff={staff}
                loading={loading}
            />
        </div>
    </main>
  );
}

const KpiPageWithProvider = () => {
    return (
        <KpiPage />
    );
};

export default KpiPageWithProvider;
