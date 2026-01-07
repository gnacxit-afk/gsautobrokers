
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
import { useAuthContext } from "@/lib/auth";

interface NewLeadDialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => void;
}

const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];
const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const languages: Array<'English' | 'Spanish'> = ['English', 'Spanish'];

const stageColors: Record<Lead['stage'], string> = {
    "Nuevo": "bg-gray-400",
    "Calificado": "bg-blue-400",
    "Citado": "bg-yellow-500",
    "En Seguimiento": "bg-orange-500",
    "Ganado": "bg-green-500",
    "Perdido": "bg-red-500",
};

const initialFormState = {
    name: "",
    phone: "",
    notes: [{ content: "", author: "", type: "Manual" as const, date: new Date() }],
    channel: "Facebook" as Lead['channel'],
    stage: "Nuevo" as Lead['stage'],
    language: "Spanish" as 'English' | 'Spanish',
};


export function NewLeadDialog({ children, open, onOpenChange, onAddLead }: NewLeadDialogProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();

  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'email' | 'company'>>({
    ...initialFormState
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'notes') {
        setFormData(prev => ({
            ...prev,
            notes: [{ ...prev.notes![0], content: value }]
        }));
    } else {
        setFormData(prev => ({ ...prev, [id]: value }));
    }
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
    const noteContent = formData.notes?.[0]?.content;
    if (!formData.name || !formData.phone || !formData.stage || !noteContent) {
        toast({ title: "Missing Fields", description: "Please fill out all fields marked with an asterisk (*).", variant: "destructive"});
        return;
    }

    onAddLead({ ...formData, ownerId: user.id });

    // The toast is now handled in the page.tsx to include AI analysis status.
    onOpenChange(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
            <Input id="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone*
            </Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="5551234567" className="col-span-3" />
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
            <Label htmlFor="stage" className="text-right">
              Stage*
            </Label>
            <Select onValueChange={(v) => handleSelectChange('stage', v as Lead['stage'])} value={formData.stage}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {leadStages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    <div className="flex items-center gap-2">
                        <Circle className={cn("h-3 w-3 fill-current", stageColors[stage])} />
                        <span>{stage}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Initial Note*
              </Label>
              <Textarea
                id="notes"
                value={formData.notes?.[0]?.content || ""}
                onChange={handleInputChange}
                placeholder="Add any initial notes for this lead."
                className="col-span-3"
              />
            </div>
            <div>
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

    