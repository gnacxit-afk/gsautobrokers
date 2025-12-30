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
import { Wand2, Loader2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import { suggestLeadFields } from "@/ai/flows/lead-generation-field-suggestion";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lead } from "@/lib/types";

interface NewLeadDialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];
const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];

export function NewLeadDialog({ children, open, onOpenChange }: NewLeadDialogProps) {
  const [description, setDescription] = useState("");
  const [suggestedFields, setSuggestedFields] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

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

  const handleSave = () => {
    toast({
        title: "Lead Saved",
        description: "The new lead has been successfully saved.",
    });
    onOpenChange(false);
    // Reset state for next time
    setDescription("");
    setSuggestedFields([]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Input id="name" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone Number
            </Label>
            <Input id="phone" type="tel" className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="channel" className="text-right">
              Channel
            </Label>
            <Select>
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
            <Select>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
