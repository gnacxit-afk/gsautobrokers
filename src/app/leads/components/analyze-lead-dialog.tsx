"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import { analyzeAndUpdateLead, AnalyzeAndUpdateLeadOutput } from "@/ai/flows/analyze-and-update-leads";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyzeLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalyzeLeadDialog({ lead, open, onOpenChange }: AnalyzeLeadDialogProps) {
    const [analysis, setAnalysis] = useState<AnalyzeAndUpdateLeadOutput | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (open && lead) {
            setAnalysis(null);
            startTransition(async () => {
                const leadDetails = `Name: ${lead.name}, Company: ${lead.company}, Status: ${lead.status}, Notes: ${lead.notes}`;
                const result = await analyzeAndUpdateLead({ leadDetails });
                setAnalysis(result);
            });
        }
    }, [open, lead]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>AI Lead Analysis: {lead.name}</DialogTitle>
                    <DialogDescription>
                        Analyzing lead to determine quality and next steps.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {isPending && (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Analyzing...</p>
                        </div>
                    )}
                    {analysis && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Fit Assessment:</h3>
                                {analysis.isGoodFit ? (
                                    <Badge>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Good Fit
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Poor Fit
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-semibold">Reasoning:</h3>
                                <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
                            </div>

                             <div className="space-y-1">
                                <h3 className="font-semibold">Suggested Next Steps:</h3>
                                <p className="text-sm text-muted-foreground">{analysis.updatedLeadInformation}</p>
                            </div>
                        </div>
                    )}
                </div>
                 <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogContent>
        </Dialog>
    );
}
