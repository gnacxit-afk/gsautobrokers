"use client";

import * as React from "react";
import type { Row } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/lib/types";

interface RenderSubComponentProps {
    row: Row<Lead>;
    onUpdateNotes: (id: string, notes: string) => void;
}

export const RenderSubComponent: React.FC<RenderSubComponentProps> = ({ row, onUpdateNotes }) => {
    const { toast } = useToast();
    const [notes, setNotes] = React.useState(row.original.notes || "");

    const handleSaveNotes = () => {
        onUpdateNotes(row.original.id, notes);
        toast({ title: "Notes Updated", description: "The notes for this lead have been saved." });
    }

    return (
        <Card className="m-4 bg-slate-50">
            <CardContent className="p-4">
                <div className="space-y-2">
                    <Label htmlFor={`notes-${row.id}`} className="font-semibold">Lead Notes</Label>
                    <Textarea
                        id={`notes-${row.id}`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for this lead..."
                        className="h-24"
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
