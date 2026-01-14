
'use client';

import { useState, useEffect } from 'react';
import type { Appointment } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

interface EditAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
  onAppointmentUpdated: () => void;
}

export function EditAppointmentDialog({ open, onOpenChange, appointment, onAppointmentUpdated }: EditAppointmentDialogProps) {
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [time, setTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (appointment && open) {
      const existingStartTime = appointment.startTime.toDate();
      setAppointmentDate(format(existingStartTime, 'yyyy-MM-dd'));
      setTime(format(existingStartTime, 'HH:mm'));
    }
  }, [appointment, open]);

  const handleSaveChanges = async () => {
    if (!firestore || !user || !appointment || !appointmentDate) {
      toast({
        title: 'Error',
        description: 'Missing information to reschedule the appointment.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    // Combine date from date picker and time from time picker
    const [hours, minutes] = time.split(':').map(Number);
    // Use replace to handle cross-browser date parsing inconsistencies
    const finalDateTime = new Date(appointmentDate.replace(/-/g, '/'));
    finalDateTime.setHours(hours, minutes, 0, 0);

    const oldTime = format(appointment.startTime.toDate(), "eeee, d 'de' MMMM 'at' p", { locale: es });
    const newTime = format(finalDateTime, "eeee, d 'de' MMMM 'at' p", { locale: es });

    try {
      const appointmentRef = doc(firestore, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        startTime: finalDateTime,
        endTime: addMinutes(finalDateTime, 30),
      });

      // Add a note to the lead's history about the reschedule
      const noteHistoryRef = collection(firestore, 'leads', appointment.leadId, 'noteHistory');
      await addDoc(noteHistoryRef, {
          content: `Appointment rescheduled by ${user.name} from ${oldTime} to ${newTime}.`,
          author: 'System',
          date: serverTimestamp(),
          type: 'System',
      });

      toast({
        title: 'Appointment Rescheduled!',
        description: `Appointment with ${appointment.leadName} has been moved to ${newTime}.`,
      });

      onAppointmentUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Reschedule Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Reschedule the appointment for <span className="font-bold">{appointment.leadName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date">New Date</Label>
                    <Input 
                        id="date"
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="time">New Time</Label>
                    <Input 
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
