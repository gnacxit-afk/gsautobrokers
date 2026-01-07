
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
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface AddNoteDialogProps {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNote: (leadId: string, noteContent: string) => void;
}


export function AddNoteDialog({ leadId, open, onOpenChange, onAddNote }: AddNoteDialogProps) {
  const { toast } = useToast();
  const [noteContent, setNoteContent] = useState("");


  const handleSave = () => {
    if (!noteContent) {
        toast({ title: "Note is empty", description: "Please enter some content for the note.", variant: "destructive"});
        return;
    }

    onAddNote(leadId, noteContent);
    onOpenChange(false);
    setNoteContent("");
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setNoteContent("");
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Note</DialogTitle>
          <DialogDescription>
            Enter the details for your new note. It will be timestamped automatically.
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
                className="col-span-3 min-h-[120px]"
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
