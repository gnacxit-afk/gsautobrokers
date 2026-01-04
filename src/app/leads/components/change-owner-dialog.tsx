'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Lead, Staff } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface ChangeOwnerDialogProps {
  lead: Lead;
  staff: Staff[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOwner: (leadId: string, newOwner: Staff) => void;
}

export function ChangeOwnerDialog({
  lead,
  staff,
  open,
  onOpenChange,
  onUpdateOwner,
}: ChangeOwnerDialogProps) {
  const [selectedOwnerId, setSelectedOwnerId] = useState(lead.ownerId);
  const { toast } = useToast();

  const assignableStaff = staff.filter(
    (s) => s.role === 'Broker' || s.role === 'Supervisor'
  );

  const handleSave = () => {
    const newOwner = staff.find((s) => s.id === selectedOwnerId);
    if (newOwner) {
      onUpdateOwner(lead.id, newOwner);
      toast({
        title: 'Owner Updated',
        description: `Lead "${lead.name}" reassigned to ${newOwner.name}.`,
      });
      onOpenChange(false);
    } else {
      toast({
        title: 'Error',
        description: 'Could not find the selected staff member.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Lead Owner</DialogTitle>
          <DialogDescription>
            Reassign the lead "{lead.name}" to a different staff member.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">
              New Owner
            </Label>
            <Select
              value={selectedOwnerId}
              onValueChange={setSelectedOwnerId}
            >
              <SelectTrigger id="owner" className="col-span-3">
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                {assignableStaff.map((staffMember) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
