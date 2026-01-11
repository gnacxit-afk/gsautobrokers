
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { Lead } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AppointmentDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDateSet: (lead: Lead, date: Date | null) => void;
}

export function AppointmentDialog({ lead, open, onOpenChange, onDateSet }: AppointmentDialogProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    lead?.appointmentDate ? (lead.appointmentDate as any).toDate() : undefined
  );
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!lead || !date || !firestore) return;

    try {
        const leadRef = doc(firestore, 'leads', lead.id);
        await updateDoc(leadRef, {
            appointmentDate: date
        });
        onDateSet(lead, date);
        toast({ title: "Appointment Updated", description: "The new date has been saved." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to update appointment date.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Appointment Date</DialogTitle>
          <DialogDescription>Select a date for the appointment with {lead?.name}.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!date}>Save Date</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
