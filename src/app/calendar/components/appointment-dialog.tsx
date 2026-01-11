
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

interface AppointmentDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDateSet: (lead: Lead, appointment: Appointment) => void;
}

export function AppointmentDialog({ lead, open, onOpenChange, onDateSet }: AppointmentDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>('');
  const [confirmed, setConfirmed] = useState<boolean>(false);
  
  const firestore = useFirestore();
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
    if (!lead || !date || !firestore) return;

    try {
        const leadRef = doc(firestore, 'leads', lead.id);
        
        const newAppointmentData: Appointment = {
            date: Timestamp.fromDate(date),
            time: time || null,
            confirmed: confirmed,
        };
        
        await updateDoc(leadRef, {
            appointment: newAppointmentData
        });
        
        onDateSet(lead, newAppointmentData);
        toast({ title: "Appointment Updated", description: "The appointment details have been saved." });
    } catch (error) {
        toast({ title: "Error", description: "Failed to update appointment details.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
                    <Label htmlFor="time">Time (optional)</Label>
                    <Input 
                        id="time"
                        type="time"
                        value={time}
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
