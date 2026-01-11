
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

interface EditLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
}

export function EditLeadDialog({ open, onOpenChange, lead }: EditLeadDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        phone: lead.phone,
      });
    }
  }, [lead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!firestore) return;

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
      await updateDoc(leadRef, {
        name: formData.name,
        phone: formData.phone,
      });
      toast({
        title: "Lead Updated",
        description: "The lead's information has been saved.",
      });
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
