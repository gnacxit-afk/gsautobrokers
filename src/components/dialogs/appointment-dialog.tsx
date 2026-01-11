
'use client';

import { useState, useEffect } from 'react';
import type { Lead } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
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
  selectedDate: Date | null;
  leads: Lead[];
  preselectedLead?: Lead | null;
}

export function AppointmentDialog({ open, onOpenChange, selectedDate, leads, preselectedLead }: AppointmentDialogProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [time, setTime] = useState('09:00');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (preselectedLead) {
        setSelectedLead(preselectedLead);
    }
  }, [preselectedLead, open]);

  useEffect(() => {
    // Reset state when dialog is closed
    if (!open) {
      setSelectedLead(null);
      setTime('09:00');
    }
  }, [open]);

  const handleSave = async () => {
    if (!firestore || !user || !selectedLead || !selectedDate) {
      toast({
        title: 'Error',
        description: 'Missing information to book an appointment.',
        variant: 'destructive',
      });
      return;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentTime = new Date(selectedDate);
    appointmentTime.setHours(hours, minutes);

    try {
      const appointmentsCollection = collection(firestore, 'appointments');
      await addDoc(appointmentsCollection, {
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        startTime: appointmentTime,
        endTime: addMinutes(appointmentTime, 30), // Assuming 30 min appointments
        ownerId: selectedLead.ownerId, // The appointment owner is the lead's owner
        status: selectedLead.stage === 'Ganado' || selectedLead.stage === 'Calificado' ? 'Hot' : 'Warm', // Example logic
      });

      toast({
        title: 'Appointment Booked!',
        description: `Appointment with ${selectedLead.name} at ${format(appointmentTime, 'p')} has been saved.`,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          {selectedDate && (
            <DialogDescription>
              Scheduling for {format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="lead-search">Lead</Label>
            {preselectedLead ? (
                 <div className="p-2 border rounded-md bg-slate-50">{preselectedLead.name}</div>
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
                        onSelect={() => {
                            setSelectedLead(lead);
                        }}
                        >
                        {lead.name}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            )}
          </div>

          {selectedLead && (
             <div className="space-y-2">
                <Label htmlFor="time">Appointment Time</Label>
                <Input 
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
            </div>
          )}

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedLead}>Save Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
