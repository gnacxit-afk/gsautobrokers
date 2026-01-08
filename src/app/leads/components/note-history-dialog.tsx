
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection } from "@/firebase";
import { useAuthContext } from "@/lib/auth";
import type { Lead, NoteEntry } from "@/lib/types";
import { collection, orderBy, query } from "firebase/firestore";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Edit, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteHistoryDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNote: (leadId: string, content: string) => void;
}

const getIconForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return <User size={14} />;
        case 'Stage Change': return <ArrowRight size={14} />;
        case 'Owner Change': return <Edit size={14} />;
        default: return <Bot size={14} />;
    }
};

const getColorForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return "bg-sky-100 text-sky-800";
        case 'Stage Change': return "bg-amber-100 text-amber-800";
        case 'Owner Change': return "bg-purple-100 text-purple-800";
        default: return "bg-slate-100 text-slate-800";
    }
}

export function NoteHistoryDialog({ lead, open, onOpenChange, onAddNote }: NoteHistoryDialogProps) {
  const [newNote, setNewNote] = useState("");
  const firestore = useFirestore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const notesQuery = useMemo(() => {
    if (!firestore || !lead) return null;
    return query(collection(firestore, "leads", lead.id, "noteHistory"), orderBy("date", "desc"));
  }, [firestore, lead]);

  const { data: noteHistory, loading } = useCollection<NoteEntry>(notesQuery);

  const handleSaveNote = () => {
    if (newNote.trim()) {
      onAddNote(lead.id, newNote);
      setNewNote("");
      onOpenChange(false);
    }
  };
  
  useEffect(() => {
    // Scroll to bottom when new notes are added
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [noteHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Notes & History for {lead.name}</DialogTitle>
          <DialogDescription>
            View the activity log and add new notes for this lead.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-[60vh]">
            <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
                 <div className="space-y-6" ref={scrollAreaRef}>
                    {loading ? (
                        <>
                         <Skeleton className="h-16 w-full" />
                         <Skeleton className="h-16 w-full" />
                         <Skeleton className="h-16 w-full" />
                        </>
                    ) : noteHistory && noteHistory.length > 0 ? (
                        noteHistory.map(note => (
                            <div key={note.id} className="flex items-start gap-4">
                                <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", getColorForType(note.type))}>
                                    {getIconForType(note.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-sm text-slate-800">{note.author}</p>
                                        <p className="text-xs text-slate-400">
                                            {format((note.date as any)?.toDate() || new Date(note.date as string), 'MMM d, yyyy h:mm a')}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-600">{note.content}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10 text-slate-500">
                            <p>No notes or history for this lead yet.</p>
                        </div>
                    )}
                 </div>
            </ScrollArea>
            <div className="mt-auto pt-4 border-t">
                 <Textarea
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="mb-2"
                />
                <Button onClick={handleSaveNote} className="w-full" disabled={!newNote.trim()}>
                    Save Note
                </Button>
            </div>
        </div>

        <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
