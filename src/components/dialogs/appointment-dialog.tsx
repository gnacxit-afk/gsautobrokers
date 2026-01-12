
'use client';

import { useState, useEffect } from 'react';
import type { Lead } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  leads: Lead[];
  preselectedLead?: Lead | null;
}

export function AppointmentDialog({ open, onOpenChange, selectedDate: initialDate, leads, preselectedLead }: AppointmentDialogProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [time, setTime] = useState('09:00');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
        if (preselectedLead) {
            setSelectedLead(preselectedLead);
        }
        // Set the initial date to today or the passed date
        setAppointmentDate(format(initialDate, 'yyyy-MM-dd'));
        setTime(format(initialDate, 'HH:mm'));
    } else {
        // Reset when dialog closes
        setSelectedLead(null);
        setAppointmentDate('');
    }
  }, [open, preselectedLead, initialDate]);

  const handleSave = async () => {
    if (!firestore || !user || !selectedLead || !appointmentDate) {
      toast({
        title: 'Error',
        description: 'Missing information to book an appointment.',
        variant: 'destructive',
      });
      return;
    }
    
    // Combine date from date picker and time from time picker
    const [hours, minutes] = time.split(':').map(Number);
    const finalDateTime = new Date(appointmentDate);
    finalDateTime.setHours(hours, minutes, 0, 0);


    try {
      const appointmentsCollection = collection(firestore, 'appointments');
      await addDoc(appointmentsCollection, {
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        startTime: finalDateTime,
        endTime: addMinutes(finalDateTime, 30), // Assuming 30 min appointments
        ownerId: selectedLead.ownerId, // The appointment owner is the lead's owner
        status: selectedLead.stage === 'Ganado' || selectedLead.stage === 'Calificado' ? 'Hot' : 'Warm', // Example logic
      });

      // Add a note to the lead's history
      const noteHistoryRef = collection(firestore, 'leads', selectedLead.id, 'noteHistory');
      await addDoc(noteHistoryRef, {
          content: `Appointment scheduled by ${user.name} for ${format(finalDateTime, "eeee, d 'de' MMMM 'at' p", { locale: es })}.`,
          author: 'System',
          date: serverTimestamp(),
          type: 'System',
      });

      const leadRef = doc(firestore, 'leads', selectedLead.id);
      await updateDoc(leadRef, { stage: 'Citado' });
      

      toast({
        title: 'Appointment Booked!',
        description: `Appointment with ${selectedLead.name} at ${format(finalDateTime, 'p')} has been saved.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment. This will be assigned to the lead's current owner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div>
                <Label htmlFor="lead-search">Lead</Label>
                {preselectedLead ? (
                    <div className="p-2 border rounded-md bg-slate-50 font-medium">{preselectedLead.name}</div>
                ) : (
                    <Command className="rounded-lg border shadow-sm">
                    <CommandInput id="lead-search" placeholder="Search for a lead..." />
                    <CommandList>
                        <CommandEmpty>No leads found.</CommandEmpty>
                        <CommandGroup>
                        {leads.map((lead) => (
                            <CommandItem
                            key={lead.id}
                            value={lead.name}
                            onSelect={() => setSelectedLead(lead)}
                            >
                            {lead.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                    </Command>
                )}
            </div>

            {selectedLead ? (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Appointment Date</Label>
                        <Input 
                            id="date"
                            type="date"
                            value={appointmentDate}
                            onChange={(e) => setAppointmentDate(e.target.value)}
                            min={format(new Date(), 'yyyy-MM-dd')}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="time">Appointment Time</Label>
                        <Input 
                            id="time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center pt-4">Select a lead to continue.</p>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedLead || !appointmentDate}>Save Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    