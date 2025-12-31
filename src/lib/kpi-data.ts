import type { KPI } from './types';
import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';


// In a real application, this data would come from a database.
// This data is now seeded into Firestore and this file is primarily for updating.

export const updateKpi = async (db: Firestore, id: string, newTarget: string): Promise<void> => {
  const kpiRef = doc(db, 'kpis', id);
  await updateDoc(kpiRef, { target: newTarget });
};
