
'use client';

import React, { useState, useEffect } from 'react';
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
import type { Lead, Appointment } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { addNoteEntry } from '@/lib/utils';
import { useAuthContext } from '@/lib/auth';

interface AppointmentDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDateSet: () => void;
}

export function AppointmentDialog({ lead, open, onOpenChange, onDateSet }: AppointmentDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  
  const firestore = useFirestore();
  const { user } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (lead?.appointment?.date) {
        const leadDate = (lead.appointment.date as any).toDate ? (lead.appointment.date as any).toDate() : new Date(lead.appointment.date as string);
        setDate(leadDate);
    } else {
        setDate(new Date()); // Default to today if no date is set
    }
    setTime(lead?.appointment?.time || '');
    setConfirmed(lead?.appointment?.confirmed || false);
  }, [lead]);


  const handleSave = async () => {
    if (!lead || !date || !firestore || !user) return;

    try {
        const leadRef = doc(firestore, 'leads', lead.id);
        
        const oldAppointment = lead.appointment;

        const newAppointmentData: Appointment = {
            date: Timestamp.fromDate(date),
            time: time || null,
            confirmed: confirmed,
        };
        
        await updateDoc(leadRef, {
            appointment: newAppointmentData
        });
        
        // Add a note to the lead's history
        const oldDateStr = oldAppointment?.date ? new Date((oldAppointment.date as any).toDate()).toLocaleDateString() : 'N/A';
        const newDateStr = newAppointmentData.date.toDate().toLocaleDateString();
        const oldTimeStr = oldAppointment?.time || 'N/A';
        const newTimeStr = newAppointmentData.time || 'N/A';
        const oldConfirmedStr = oldAppointment?.confirmed ? 'Confirmed' : 'Not Confirmed';
        const newConfirmedStr = newAppointmentData.confirmed ? 'Confirmed' : 'Not Confirmed';
        
        let changes: string[] = [];
        if (oldDateStr !== newDateStr) changes.push(`Date from ${oldDateStr} to ${newDateStr}`);
        if (oldTimeStr !== newTimeStr) changes.push(`Time from ${oldTimeStr} to ${newTimeStr}`);
        if (oldConfirmedStr !== newConfirmedStr) changes.push(`Status changed to ${newConfirmedStr}`);

        if (changes.length > 0) {
            const noteContent = `Appointment updated: ${changes.join(', ')}.`;
            await addNoteEntry(firestore, user, lead.id, noteContent, 'System');
        }

        onDateSet();
        toast({ title: "Appointment Updated", description: "The appointment details have been saved." });
    } catch (error) {
        console.error("Error updating appointment:", error);
        toast({ title: "Error", description: "Failed to update appointment details.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment for {lead?.name}</DialogTitle>
          <DialogDescription>Set or update the appointment details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                />
            </div>
             <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                        id="time"
                        type="time"
                        value={time || ''}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                    <Switch 
                        id="confirmed"
                        checked={confirmed}
                        onCheckedChange={setConfirmed}
                    />
                    <Label htmlFor="confirmed">Confirmed</Label>
                </div>
             </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!date}>Save Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
