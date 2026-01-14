
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Lead, Appointment } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { addMinutes, format } from 'date-fns';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/lib/auth';
import { es } from 'date-fns/locale';

interface NewAppointmentFormProps {
  onAppointmentAdded: () => void;
  preselectedLead?: Lead | null;
}

const mapLeadStageToAppointmentStatus = (stage: Lead['stage']): Appointment['status'] => {
    switch (stage) {
        case 'Ganado':
        case 'Calificado':
        case 'Citado':
            return 'Hot';
        case 'En Seguimiento':
            return 'Warm';
        case 'Nuevo':
            return 'Cold';
        default:
            return 'Unknown';
    }
};

export function NewAppointmentForm({ onAppointmentAdded, preselectedLead }: NewAppointmentFormProps) {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (preselectedLead) {
        setSelectedLead(preselectedLead);
    }
  }, [preselectedLead]);

  const leadsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    const q = user.role === 'Broker' 
        ? query(collection(firestore, 'leads'), where('ownerId', '==', user.id), orderBy('name', 'asc'))
        : query(collection(firestore, 'leads'), orderBy('name', 'asc'));
    return q;
  }, [firestore, user]);

  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

  const handleSave = async () => {
    if (!firestore || !user || !selectedLead) {
      toast({
        title: 'Error',
        description: 'Please select a lead and set a date/time.',
        variant: 'destructive',
      });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const appointmentTime = new Date(date.replace(/-/g, '/'));
    appointmentTime.setHours(hours, minutes, 0, 0);

    const appointmentStatus = mapLeadStageToAppointmentStatus(selectedLead.stage);

    try {
      const appointmentsCollection = collection(firestore, 'appointments');
      await addDoc(appointmentsCollection, {
        leadId: selectedLead.id,
        leadName: selectedLead.name,
        startTime: appointmentTime,
        endTime: addMinutes(appointmentTime, 30),
        ownerId: selectedLead.ownerId, 
        status: appointmentStatus,
      });

      if (selectedLead.stage !== 'Citado') {
          const leadRef = doc(firestore, 'leads', selectedLead.id);
          await updateDoc(leadRef, { stage: 'Citado' });

          const noteHistoryRef = collection(firestore, 'leads', selectedLead.id, 'noteHistory');
          await addDoc(noteHistoryRef, {
              content: `Stage automatically changed to "Citado" upon scheduling an appointment.`,
              author: 'System',
              date: serverTimestamp(),
              type: 'Stage Change',
          });
      }
      
      const noteHistoryRef = collection(firestore, 'leads', selectedLead.id, 'noteHistory');
      await addDoc(noteHistoryRef, {
          content: `Appointment scheduled by ${user.name} for ${format(appointmentTime, "eeee, d 'de' MMMM 'at' p", { locale: es })}.`,
          author: 'System',
          date: serverTimestamp(),
          type: 'System',
      });


      toast({
        title: 'Appointment Booked!',
        description: `Appointment with ${selectedLead.name} has been saved.`,
      });
      
      setSelectedLead(null);
      onAppointmentAdded();

    } catch (error: any) {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Appointment</CardTitle>
        <CardDescription>
          Schedule a new appointment for a lead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Lead</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={leadsLoading || !!preselectedLead}
              >
                {selectedLead
                  ? selectedLead.name
                  : (leadsLoading ? "Loading leads..." : "Select a lead...")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Search lead..." />
                <CommandList>
                  <CommandEmpty>No leads found.</CommandEmpty>
                  <CommandGroup>
                    {leads?.map((lead) => (
                      <CommandItem
                        key={lead.id}
                        value={lead.name}
                        onSelect={() => {
                          setSelectedLead(lead);
                          setOpen(false);
                        }}
                      >
                        {lead.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={!selectedLead}>
          Save Appointment
        </Button>
      </CardContent>
    </Card>
  );
}
