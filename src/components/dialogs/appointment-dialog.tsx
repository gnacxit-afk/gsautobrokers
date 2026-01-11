
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
import { Calendar } from '@/components/ui/calendar';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  leads: Lead[];
  preselectedLead?: Lead | null;
}

export function AppointmentDialog({ open, onOpenChange, selectedDate: initialDate, leads, preselectedLead }: AppointmentDialogProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState('09:00');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
        if (preselectedLead) {
            setSelectedLead(preselectedLead);
        }
        setSelectedDate(initialDate);
        setTime('09:00');
    }
  }, [open, preselectedLead, initialDate]);

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

      // Add a note to the lead's history
      const noteHistoryRef = collection(firestore, 'leads', selectedLead.id, 'noteHistory');
      await addDoc(noteHistoryRef, {
          content: `Appointment scheduled by ${user.name} for ${format(appointmentTime, "eeee, d 'de' MMMM 'at' p", { locale: es })}.`,
          author: 'System',
          date: serverTimestamp(),
          type: 'System',
      });

      const leadRef = doc(firestore, 'leads', selectedLead.id);
      await updateDoc(leadRef, { stage: 'Citado' });
      

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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a lead. The appointment will be assigned to the lead's owner.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
                 <Label>Select Date</Label>
                 <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    disabled={{ before: new Date() }}
                    className="rounded-md border"
                />
            </div>
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

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!selectedLead || !selectedDate}>Save Appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
