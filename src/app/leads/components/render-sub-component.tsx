
"use client";

import * as React from "react";
import type { Row } from "@tanstack/react-table";
import { format } from 'date-fns';
import { Card, CardContent } from "@/components/ui/card";
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
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {icons[note.type]}
                    <span>{note.author}</span>
                </div>
                <span className="text-xs text-slate-500">{renderDate(note.date)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap text-slate-800">{note.content}</p>
        </div>
    )
}

export const RenderSubComponent: React.FC<RenderSubComponentProps> = ({ row, onAddNote }) => {

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
        <Card className="m-4 bg-slate-50/50 shadow-inner">
            <CardContent className="p-6">
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Lead Records</h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 rounded-lg">
                       {sortedNotes.length > 0 ? (
                           sortedNotes.map((note, index) => <Note key={index} note={note} />)
                       ) : (
                           <div className="text-sm text-gray-500 text-center py-8 bg-gray-100 rounded-lg">No records for this lead yet.</div>
                       )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
