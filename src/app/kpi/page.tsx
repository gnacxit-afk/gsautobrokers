import { getKpis } from "@/lib/kpi-data";
import { KpiClient } from "./components/kpi-client";
import { PerformanceDashboard } from "./components/performance-dashboard";
import { getLeads, getStaff } from "@/lib/mock-data";

export default function KpiPage() {
  const kpis = getKpis();
  const leads = getLeads();
  const staff = getStaff();

  return (
    <main className="flex-1 space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl font-bold">KPI's & Performance</h1>
              <p className="text-muted-foreground">Metas de desempeño diario para vendedores.</p>
          </div>
        </div>
        <KpiClient initialKpis={kpis} />
        <div className="mt-8 p-4 bg-gray-100 border border-gray-200 rounded-lg">
          <p className="text-sm font-semibold text-gray-700">👉 Si no hay número, NO cuenta como lead de trabajado.</p>
        </div>
      </div>
      
      <div className="border-t pt-8">
         <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl font-bold">Real-Time Dashboard</h1>
              <p className="text-muted-foreground">Daily performance overview.</p>
          </div>
        </div>
        <PerformanceDashboard allLeads={leads} allStaff={staff} />
      </div>

    </main>
  );
}
