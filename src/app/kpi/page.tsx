import { getKpis } from "@/lib/kpi-data";
import { KpiClient } from "./components/kpi-client";

export default function KpiPage() {
  const kpis = getKpis();

  return (
    <main className="flex-1">
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
    </main>
  );
}
