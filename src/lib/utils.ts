
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, addDoc, serverTimestamp, type Firestore } from "firebase/firestore";
import type { User } from "./types";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBonus(sales: number): number {
  if (sales >= 25) return 750;
  if (sales >= 20) return 600;
  if (sales >= 15) return 450;
  if (sales >= 10) return 250;
  if (sales >= 5) return 100;
  return 0;
}

export function getNextBonusGoal(sales: number): { nextGoal: number, needed: number } {
  if (sales < 5) return { nextGoal: 5, needed: 5 - sales };
  if (sales < 10) return { nextGoal: 10, needed: 10 - sales };
  if (sales < 15) return { nextGoal: 15, needed: 15 - sales };
  if (sales < 20) return { nextGoal: 20, needed: 20 - sales };
  if (sales < 25) return { nextGoal: 25, needed: 25 - sales };
  return { nextGoal: 25, needed: 0 };
}

export const addNoteEntry = async (
    firestore: Firestore, 
    user: User, 
    leadId: string, 
    content: string, 
    type: 'Manual' | 'Stage Change' | 'Owner Change' | 'System' | 'AI Analysis'
) => {
    if (!firestore || !user) return;
    const noteHistoryRef = collection(firestore, 'leads', leadId, 'noteHistory');
    
    await addDoc(noteHistoryRef, {
        content,
        author: user.name,
        date: serverTimestamp(),
        type,
    });
};
