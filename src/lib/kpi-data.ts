import type { KPI } from './types';

let kpis: KPI[] = [
  { id: 'received', label: 'Leads recibidos', target: '(informativo)', description: 'Total de leads asignados al vendedor.' },
  { id: 'numbers', label: 'Números obtenidos', target: '5', description: 'Leads con número de teléfono válido obtenido.' },
  { id: 'appointments', label: 'Citas agendadas', target: '3', description: 'Citas programadas con clientes potenciales.' },
  { id: 'confirmed', label: 'Citas confirmadas', target: '2', description: 'Citas que el cliente ha confirmado que asistirá.' },
  { id: 'disqualified', label: 'Leads descartados', target: '(permitido)', description: 'Leads que han sido correctamente descartados según los criterios.' },
  { id: 'sales', label: 'Ventas', target: '3', description: 'Número de ventas cerradas.' },
];

// Note: In a real application, this data would come from a database.
// These functions simulate fetching and updating the data.

export const getKpis = (): KPI[] => {
  // Return a copy to prevent direct mutation
  return JSON.parse(JSON.stringify(kpis));
};

export const updateKpi = (id: string, newTarget: string): boolean => {
  const kpiIndex = kpis.findIndex(k => k.id === id);
  if (kpiIndex !== -1) {
    kpis[kpiIndex].target = newTarget;
    return true;
  }
  return false;
};
