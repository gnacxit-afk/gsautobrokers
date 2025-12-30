"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Circle } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface NewLeadDialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => void;
}

const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];
const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];
const languages: Lead['language'][] = ['English', 'Spanish'];

const statusColors: Record<Lead['status'], string> = {
    "New": "bg-gray-400",
    "Contacted": "bg-blue-400",
    "Qualified": "bg-yellow-500",
    "On the way": "bg-orange-500",
    "On site": "bg-purple-500",
    "Sale": "bg-green-500",
    "Closed": "bg-green-600",
    "Lost": "bg-red-500",
};

const initialFormState = {
    name: "",
    phone: "+1 ",
    notes: "",
    channel: "Facebook" as Lead['channel'],
    status: "New" as Lead['status'],
    language: "Spanish" as Lead['language'],
};


export function NewLeadDialog({ children, open, onOpenChange, onAddLead }: NewLeadDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'email' | 'company'>>({
    ...initialFormState
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }
  
  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const resetForm = () => {
    setFormData(initialFormState);
  }

  const handleSave = () => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to create a lead.", variant: "destructive"});
        return;
    }

    if (!formData.name || !formData.phone || !formData.status || !formData.notes) {
        toast({ title: "Missing Fields", description: "Please fill out all fields marked with an asterisk (*).", variant: "destructive"});
        return;
    }

    onAddLead({ ...formData, ownerId: user.id });

    toast({
        title: "Lead Saved",
        description: "The new lead has been successfully saved.",
    });
    onOpenChange(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill out the lead details manually.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name*
            </Label>
            <Input id="name" className="col-span-3" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone Number*
            </Label>
            <Input id="phone" type="tel" className="col-span-3" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 123-4567" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Language
            </Label>
            <Select onValueChange={(v) => handleSelectChange('language', v as Lead['language'])} value={formData.language}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="channel" className="text-right">
              Channel
            </Label>
            <Select onValueChange={(v) => handleSelectChange('channel', v as Lead['channel'])} value={formData.channel}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map(channel => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status*
            </Label>
            <Select onValueChange={(v) => handleSelectChange('status', v as Lead['status'])} value={formData.status}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                        <Circle className={cn("h-3 w-3 fill-current", statusColors[status])} />
                        <span>{status}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes*
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Add any initial notes for this lead."
              />
            </div>
            <div className="col-span-4">
                <p className="text-xs text-muted-foreground text-center pt-2">Fields marked with an asterisk (*) are mandatory.</p>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
