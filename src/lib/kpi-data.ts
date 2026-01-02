import type { KPI } from './types';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';


// In a real application, this data would come from a database.
// This data is now seeded into Firestore and this file is primarily for updating.

export const updateKpiDoc = async (db: Firestore, kpis: KPI[]): Promise<void> => {
  const kpiRef = doc(db, 'kpis', 'kpi-doc');
  await setDoc(kpiRef, { list: kpis }, { merge: true });
};
