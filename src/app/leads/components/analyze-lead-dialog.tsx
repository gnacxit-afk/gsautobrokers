
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
import { Loader2, Zap, Star, ShieldCheck, TrendingUp, CircleDollarSign, UserCheck, CalendarClock, Target, BadgeCheck, AlertTriangle } from "lucide-react";

interface AnalyzeLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalysisComplete: (leadId: string, leadStatus: NonNullable<Lead['leadStatus']>, analysis: { decision: string; recommendation: string }) => void;
}

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground text-right">{value}</span>
    </div>
);

export function AnalyzeLeadDialog({ lead, open, onOpenChange, onAnalysisComplete }: AnalyzeLeadDialogProps) {
    const [analysis, setAnalysis] = useState<AnalyzeAndUpdateLeadOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (open && lead) {
            setAnalysis(null);
            setError(null);
            startTransition(async () => {
                try {
                    // Use the latest note if available, otherwise fallback to a generic string.
                    const latestNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1].content : "No notes available.";
                    const leadDetails = `Name: ${lead.name}, Company: ${lead.company || 'N/A'}, Stage: ${lead.stage}, Notes: ${latestNote}`;
                    
                    const result = await analyzeAndUpdateLead({ leadDetails });
                    setAnalysis(result);
                    
                    // On successful analysis, call the callback to update the parent state and add a note
                    if (result.leadStatus) {
                        onAnalysisComplete(lead.id, result.leadStatus, {
                            decision: result.qualificationDecision,
                            recommendation: result.salesRecommendation
                        });
                    }
                } catch (e: any) {
                    setError("The AI model is currently overloaded. Please try again in a few moments.");
                }
            });
        }
    }, [open, lead, onAnalysisComplete]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Zap className="text-primary"/>AI Lead Analysis: {lead.name}</DialogTitle>
                    <DialogDescription>
                        Analizando el lead para determinar la calidad y los próximos pasos.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {isPending && !error && (
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground h-48">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Analizando...</p>
                        </div>
                    )}
                    {error && (
                         <div className="flex flex-col items-center justify-center gap-4 text-destructive-foreground bg-destructive/10 p-4 rounded-lg h-48 text-center">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                            <p className="font-semibold">Analysis Failed</p>
                            <p className="text-sm text-destructive/80">{error}</p>
                        </div>
                    )}
                    {analysis && (
                        <div className="space-y-6">
                            <div className="p-4 bg-secondary rounded-lg text-center space-y-1">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Estado del Lead</p>
                                <p className="text-2xl font-bold text-primary">{analysis.leadStatus}</p>
                                <p className="text-sm text-muted-foreground">Puntuación Total: {analysis.totalScore}</p>
                            </div>

                            <div className="space-y-4">
                               <h3 className="font-semibold text-lg border-b pb-2">Desglose BANT</h3>
                               <div className="space-y-3">
                                   <InfoRow icon={<CircleDollarSign size={16} />} label="Presupuesto (Budget)" value={analysis.bantBreakdown.budget} />
                                   <InfoRow icon={<UserCheck size={16} />} label="Autoridad (Authority)" value={analysis.bantBreakdown.authority} />
                                   <InfoRow icon={<Target size={16} />} label="Necesidad (Need)" value={analysis.bantBreakdown.need} />
                                   <InfoRow icon={<CalendarClock size={16} />} label="Tiempo (Timing)" value={analysis.bantBreakdown.timing} />
                               </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg border-b pb-2">Decisión y Recomendación</h3>
                                <div className="space-y-3">
                                  <InfoRow icon={<BadgeCheck size={16} />} label="Decisión de Calificación" value={analysis.qualificationDecision} />
                                  <InfoRow icon={<TrendingUp size={16} />} label="Recomendación de Venta" value={analysis.salesRecommendation} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                 <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogContent>
        </Dialog>
    );
}

    