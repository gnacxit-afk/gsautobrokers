
"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase";

import type { Lead, NoteEntry } from "@/lib/types";
import { collection, orderBy, query, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Edit, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { enhanceLeadNotes } from "@/ai/flows/enhance-lead-notes";
import { useToast } from "@/hooks/use-toast";


const getIconForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return <User size={14} />;
        case 'Stage Change': return <ArrowRight size={14} />;
        case 'Owner Change': return <Edit size={14} />;
        case 'AI Analysis': return <Bot size={14} />;
        default: return <Bot size={14} />;
    }
};

const getColorForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return "bg-sky-100 text-sky-800";
        case 'Stage Change': return "bg-amber-100 text-amber-800";
        case 'Owner Change': return "bg-purple-100 text-purple-800";
        case 'AI Analysis': return "bg-slate-100 text-slate-800";
        default: return "bg-slate-100 text-slate-800";
    }
}

export default function LeadNotesPage() {
  const [newNote, setNewNote] = useState("");
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user } = useUser();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const leadDocRef = useMemo(() => firestore && leadId ? doc(firestore, 'leads', leadId) : null, [firestore, leadId]);
  const {data: lead, loading: leadLoading} = useDoc<Lead>(leadDocRef);

  const notesQuery = useMemo(() => {
    if (!firestore || !leadId) return null;
    return query(collection(firestore, "leads", leadId, "noteHistory"), orderBy("date", "desc"));
  }, [firestore, leadId]);

  const {data: noteHistory, loading: notesLoading} = useCollection<NoteEntry>(notesQuery);

  const addNoteEntry = useCallback(async (leadId: string, content: string, type: NoteEntry['type'], author?: string) => {
    if (!firestore || !user) return;
    const noteHistoryRef = collection(firestore, 'leads', leadId, 'noteHistory');
    
    await addDoc(noteHistoryRef, {
        content,
        author: author || user.name,
        date: serverTimestamp(),
        type,
    });
    
    const leadRef = doc(firestore, 'leads', leadId);
    await updateDoc(leadRef, { lastActivity: serverTimestamp() });
  }, [firestore, user]);


  const handleSaveNote = useCallback(async () => {
    if (newNote.trim() && leadId && firestore && user) {
        const noteContent = newNote;
        setNewNote(""); // Clear input immediately
        
        // Save manual note
        await addNoteEntry(leadId, noteContent, 'Manual');
        toast({ title: "Note Saved", description: "Your note has been added to the history." });

        // Trigger AI analysis
        try {
            const { enhancedNotes } = await enhanceLeadNotes({ leadNotes: noteContent });
            if (enhancedNotes) {
                await addNoteEntry(leadId, enhancedNotes, 'AI Analysis', 'AI Assistant');
                toast({ title: "AI Analysis Complete", description: "AI-powered suggestions have been added." });
            }
        } catch (error) {
            console.error("AI analysis failed:", error);
            toast({ title: "AI Analysis Failed", description: "Could not get AI suggestions for this note.", variant: "destructive" });
        }
    }
  }, [newNote, leadId, firestore, user, addNoteEntry, toast]);
  
  useEffect(() => {
    // Scroll to the bottom of the notes list when new notes are added
    if (scrollAreaRef.current) {
        setTimeout(() => {
             if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
             }
        }, 100);
    }
  }, [noteHistory]);

  const loading = leadLoading || notesLoading;

  return (
    <main className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 mb-6">
             <Button variant="outline" size="icon" onClick={() => router.push('/leads')}>
                <ArrowLeft />
            </Button>
            <div>
              <h3 className="text-xl font-bold">Notes & History</h3>
              <div className="text-sm text-muted-foreground">For lead: {lead?.name || <div className="animate-pulse rounded-md bg-muted h-4 w-32 inline-block" />}</div>
            </div>
        </div>

        <Card className="flex flex-col flex-1 max-h-[calc(100vh-14rem)]">
            <CardContent className="p-6 flex flex-col flex-1">
                <ScrollArea className="flex-1 pr-4 -mr-4 mb-4" ref={scrollAreaRef}>
                     <div className="space-y-6">
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
                                                {format((note.date as any)?.toDate ? (note.date as any).toDate() : new Date(note.date as string), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>
                                        <p className="text-sm text-slate-600">{note.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                             <div className="text-center py-10 text-slate-500 h-full flex items-center justify-center">
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
                        Save Note & Get AI Analysis
                    </Button>
                </div>
            </CardContent>
        </Card>
    </main>
  );
}
