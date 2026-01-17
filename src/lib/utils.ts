
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { collection, addDoc, serverTimestamp, type Firestore, doc, updateDoc } from "firebase/firestore";
import type { User, Lead } from "./types";


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
    
    try {
        const noteHistoryRef = collection(firestore, 'leads', leadId, 'noteHistory');
        
        await addDoc(noteHistoryRef, {
            content,
            author: user.name,
            date: serverTimestamp(),
            type,
        });

        const leadRef = doc(firestore, 'leads', leadId);
        // Also update the lead's lastActivity timestamp
        await updateDoc(leadRef, {
            lastActivity: serverTimestamp()
        });

    } catch (error) {
        console.error("Error adding note entry:", error);
        // It's better to re-throw or handle the error in the calling component
        // than to just log it here. For now, we'll log it.
    }
};

export const createNotification = async (
    firestore: any,
    userId: string,
    lead: Lead,
    content: string,
    author: string,
) => {
    const notificationsCollection = collection(firestore, 'notifications');
    await addDoc(notificationsCollection, {
        userId,
        leadId: lead.id,
        leadName: lead.name,
        content,
        author,
        createdAt: serverTimestamp(),
        read: false,
    });
};

export function exportToCsv(filename: string, data: Lead[]) {
  if (!data || data.length === 0) {
    alert('No data available to export for the current selection.');
    return;
  }

  const headers = ['Name', 'Phone', 'Email', 'Stage', 'Owner', 'Channel', 'Creation Date'];
  const csvRows = [headers.join(',')];

  const processValue = (value: any) => {
    const stringValue = String(value ?? '').replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  for (const lead of data) {
    let creationDate = '';
    if (lead.createdAt) {
      try {
        // Handle both Firebase Timestamp and string/Date
        const date = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as any);
        creationDate = date.toISOString().split('T')[0];
      } catch (e) {
        creationDate = 'Invalid Date';
      }
    }

    const values = [
      lead.name,
      lead.phone,
      lead.email,
      lead.stage,
      lead.ownerName,
      lead.channel,
      creationDate
    ].map(processValue);
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
