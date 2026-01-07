
"use client";

import * as React from "react";
import type { Row } from "@tanstack/react-table";
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Lead, NoteEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bot, User, Cog } from "lucide-react";

interface RenderSubComponentProps {
    row: Row<Lead>;
    onAddNote: (leadId: string, noteContent: string) => void;
}

const Note = ({ note }: { note: NoteEntry }) => {
    const renderDate = (date: any) => {
        if (!date) return 'N/A';
        // Handles Firestore Timestamps, JS Dates, and date strings
        const d = date.toDate ? date.toDate() : new Date(date);
        // Check if the date is valid before formatting
        if (isNaN(d.getTime())) return 'Saving...';
        return format(d, "MMM d, yyyy 'at' h:mm a");
    }

    const icons = {
        'Manual': <User className="h-4 w-4" />,
        'AI Analysis': <Bot className="h-4 w-4" />,
        'System': <Cog className="h-4 w-4" />,
    }

    const colors = {
        'Manual': 'bg-white',
        'AI Analysis': 'bg-blue-50 border-blue-100',
        'System': 'bg-gray-50 border-gray-100',
    }

    return (
        <div className={cn("p-4 rounded-lg border", colors[note.type])}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    {icons[note.type]}
                    <span>{note.author}</span>
                </div>
                <span className="text-xs text-gray-500">{renderDate(note.date)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
        </div>
    )
}

export const RenderSubComponent: React.FC<RenderSubComponentProps> = ({ row, onAddNote }) => {
    const [newNote, setNewNote] = React.useState("");

    const handleSaveNote = () => {
        if (newNote.trim() === "") return;
        onAddNote(row.original.id, newNote);
        setNewNote("");
    }

    const sortedNotes = React.useMemo(() => {
        // Defensive sorting to handle various date types during optimistic updates
        const toDate = (date: any): Date | null => {
            if (!date) return null;
            if (date.toDate) return date.toDate(); // Firestore Timestamp
            const d = new Date(date);
            return isNaN(d.getTime()) ? null : d; // JS Date or ISO string
        };

        return [...(row.original.notes || [])].sort((a, b) => {
            const dateA = toDate(a.date);
            const dateB = toDate(b.date);

            // Keep notes without a valid client-side date (like serverTimestamps) at the top
            if (!dateB) return 1;
            if (!dateA) return -1;
            
            return dateB.getTime() - dateA.getTime();
        });
    }, [row.original.notes]);


    return (
        <Card className="m-4 bg-slate-50/50">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Lead History</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                       {sortedNotes.length > 0 ? (
                           sortedNotes.map((note, index) => <Note key={index} note={note} />)
                       ) : (
                           <p className="text-sm text-gray-500 text-center py-4">No notes for this lead yet.</p>
                       )}
                    </div>
                     <div className="space-y-2 pt-4 border-t">
                        <Textarea
                            id={`new-note-${row.id}`}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a new note..."
                            className="h-24 bg-white"
                        />
                        <div className="flex justify-end">
                            <Button size="sm" onClick={handleSaveNote} disabled={!newNote.trim()}>Add Note</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

