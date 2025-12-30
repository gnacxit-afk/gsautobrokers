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
import { Wand2, Loader2, Circle } from "lucide-react";
import React, { useState, useTransition } from "react";
import { suggestLeadFields } from "@/ai/flows/lead-generation-field-suggestion";
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
    phone: "",
    email: "",
    company: "",
    notes: "",
    channel: "" as Lead['channel'],
    status: "New" as Lead['status'],
};


export function NewLeadDialog({ children, open, onOpenChange, onAddLead }: NewLeadDialogProps) {
  const [description, setDescription] = useState("");
  const [suggestedFields, setSuggestedFields] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'createdAt' | 'ownerId' | 'ownerName'>>({
    ...initialFormState
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }
  
  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  }


  const handleSuggestFields = () => {
    if (!description) {
      toast({
        title: "Description is empty",
        description: "Please enter a description for the lead first.",
        variant: "destructive",
      });
      return;
    }
    startTransition(async () => {
      const result = await suggestLeadFields({ leadDescription: description });
      if (result.suggestedFields) {
        setSuggestedFields(result.suggestedFields);
        toast({
          title: "Fields Suggested",
          description: "AI has suggested some fields for you.",
        });
      }
    });
  };
  
  const resetForm = () => {
    setDescription("");
    setSuggestedFields([]);
    setFormData(initialFormState);
  }

  const handleSave = () => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to create a lead.", variant: "destructive"});
        return;
    }

    if (!formData.name || !formData.phone) {
        toast({ title: "Missing Fields", description: "Please fill out at least Name and Phone.", variant: "destructive"});
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
            Describe the lead and let AI suggest relevant fields, or fill them
            out manually.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 'A new prospect from a tech company looking for a reliable SUV for their family. They mentioned needing a lot of cargo space and good fuel economy.'"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSuggestFields} disabled={isPending} variant="outline" size="sm">
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Suggest Fields with AI
            </Button>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input id="name" className="col-span-3" value={formData.name} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone Number
            </Label>
            <Input id="phone" type="tel" className="col-span-3" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" className="col-span-3" value={formData.email} onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Company
            </Label>
            <Input id="company" className="col-span-3" value={formData.company} onChange={handleInputChange} />
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
              Status
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
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Add any initial notes for this lead."
              />
            </div>
          {suggestedFields.map((field) => (
            <div key={field} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.toLowerCase().replace(/\s/g, "-")} className="text-right">
                {field}
              </Label>
              <Input
                id={field.toLowerCase().replace(/\s/g, "-")}
                className="col-span-3"
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
