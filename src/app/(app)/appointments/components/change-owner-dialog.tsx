'use client';

import { useState } from 'react';
import type { Appointment, Staff } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { updateDoc, doc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

interface ChangeAppointmentOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
  onAppointmentUpdated: () => void;
  brokers: Staff[];
}

export function ChangeAppointmentOwnerDialog({ open, onOpenChange, appointment, onAppointmentUpdated, brokers }: ChangeAppointmentOwnerDialogProps) {
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    if (!firestore || !user || !appointment || !newOwnerId) {
      toast({
        title: 'Error',
        description: 'Please select a new owner.',
        variant: 'destructive',
      });
      return;
    }
    
    const newOwner = brokers.find(b => b.id === newOwnerId);
    if (!newOwner) {
        toast({ title: "Error", description: "Selected broker not found.", variant: 'destructive'});
        return;
    }

    const oldOwnerName = brokers.find(b => b.id === appointment.ownerId)?.name || 'Unknown';
    
    setIsSaving(true);
    
    try {
      const appointmentRef = doc(firestore, 'appointments', appointment.id);
      await updateDoc(appointmentRef, {
        ownerId: newOwnerId,
      });

      const noteHistoryRef = collection(firestore, 'leads', appointment.leadId, 'noteHistory');
      await addDoc(noteHistoryRef, {
          content: `Appointment for ${format(appointment.startTime.toDate(), "d MMM yyyy, p", { locale: es })} reassigned from ${oldOwnerName} to ${newOwner.name} by ${user.name}.`,
          author: 'System',
          date: serverTimestamp(),
          type: 'Owner Change',
      });

      toast({
        title: 'Appointment Reassigned!',
        description: `Appointment for ${appointment.leadName} is now owned by ${newOwner.name}.`,
      });

      onAppointmentUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Reassignment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) onOpenChange(false);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Appointment Owner</DialogTitle>
          <DialogDescription>
            Reassign the appointment for <span className="font-bold">{appointment.leadName}</span> to a different broker.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="new-owner">New Broker</Label>
                <Select onValueChange={setNewOwnerId} value={newOwnerId}>
                    <SelectTrigger id="new-owner">
                        <SelectValue placeholder="Select a new owner" />
                    </SelectTrigger>
                    <SelectContent>
                        {brokers.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving || !newOwnerId}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
