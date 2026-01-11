
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { addNoteEntry } from "@/lib/utils";
import { useAuthContext } from "@/lib/auth";

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function EditLeadDialog({ open, onOpenChange, lead }: EditLeadDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useAuthContext();

  const [formData, setFormData] = useState({
    name: lead.name,
    phone: lead.phone || '',
  });

  // This useEffect now correctly populates the form state ONLY when the dialog opens.
  // It will not re-run if the `lead` prop changes while the dialog is already open,
  // thus breaking the infinite render loop.
  useEffect(() => {
    if (open) {
      setFormData({
        name: lead.name,
        phone: lead.phone || '',
      });
    }
  }, [open]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!firestore || !user) return;

    if (!formData.name || !formData.phone) {
      toast({
        title: "Missing Fields",
        description: "Please fill out both name and phone.",
        variant: "destructive",
      });
      return;
    }

    const leadRef = doc(firestore, 'leads', lead.id);
    try {
      const changes: string[] = [];
      if (lead.name !== formData.name) {
        changes.push(`Name changed from '${lead.name}' to '${formData.name}'`);
      }
      if (lead.phone !== formData.phone) {
        changes.push(`Phone changed from '${lead.phone || 'N/A'}' to '${formData.phone}'`);
      }

      if (changes.length > 0) {
        await updateDoc(leadRef, {
          name: formData.name,
          phone: formData.phone,
        });

        const noteContent = `Lead information updated: ${changes.join('. ')}.`;
        await addNoteEntry(firestore, user, lead.id, noteContent, 'System');
        
        toast({
          title: "Lead Updated",
          description: "The lead's information has been saved.",
        });
      } else {
         toast({
          title: "No Changes",
          description: "No changes were made to the lead's information.",
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Update Failed",
        description: "Could not save lead information.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Lead Information</DialogTitle>
          <DialogDescription>
            Update the name and phone number for this lead.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
