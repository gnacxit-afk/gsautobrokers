
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/lib/types";

interface AddNoteDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveNote: (leadId: string, noteContent: string) => void;
}


export function AddNoteDialog({ lead, open, onOpenChange, onSaveNote }: AddNoteDialogProps) {
  const { toast } = useToast();
  const [noteContent, setNoteContent] = useState("");
  
  useEffect(() => {
    if (lead) {
      setNoteContent(lead.note || "");
    }
  }, [lead]);


  const handleSave = () => {
    if (!lead) return;
    
    if (!noteContent) {
        toast({ title: "Note is empty", description: "Please enter some content for the note.", variant: "destructive"});
        return;
    }

    onSaveNote(lead.id, noteContent);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setNoteContent("");
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Note for {lead?.name}</DialogTitle>
          <DialogDescription>
            You can modify the lead's main note here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-start gap-4">
              <Label htmlFor="noteContent" className="sr-only">
                Note Content
              </Label>
              <Textarea
                id="noteContent"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add your note here..."
                className="col-span-3 min-h-[200px]"
              />
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
