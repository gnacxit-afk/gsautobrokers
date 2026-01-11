
'use client';

import { useState, useEffect } from 'react';
import type { Lead } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSlot: Date | null;
  leads: Lead[];
}

export function AppointmentDialog({ open, onOpenChange, selectedSlot, leads }: AppointmentDialogProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Reset selected lead when dialog is closed
    if (!open) {
      setSelectedLead(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!firestore || !user || !selectedLead || !selectedSlot) {
      toast({
        title: 'Error',
        description: 'Missing information to book an appointment.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const appointmentsCollection = collection(firestore, 'appointments');
      await addDoc(appointmentsCollection, {
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        startTime: selectedSlot,
        endTime: addMinutes(selectedSlot, 30), // Assuming 30 min appointments
        ownerId: user.id,
        status: selectedLead.stage === 'Ganado' || selectedLead.stage === 'Calificado' ? 'Hot' : 'Warm', // Example logic
      });

      toast({
        title: 'Appointment Booked!',
        description: `Appointment with ${selectedLead.name} at ${format(selectedSlot, 'p')} has been saved.`,
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
          {selectedSlot && (
            <DialogDescription>
              Scheduling for {format(selectedSlot, "eeee, d 'de' MMMM 'at' p", { locale: es })}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="lead-search">Select a Lead</Label>
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
          </div>
          {selectedLead && (
            <div className="p-4 bg-slate-50 rounded-md border text-sm">
                <p className="font-bold">{selectedLead.name}</p>
                <p className="text-muted-foreground">{selectedLead.phone}</p>
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
