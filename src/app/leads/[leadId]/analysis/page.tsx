
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirestore } from '@/firebase';
import type { Lead, NoteEntry, LeadStatus } from '@/lib/types';
import { qualifyLead } from '@/ai/flows/qualify-lead-flow';
import type { QualifyLeadOutput } from '@/ai/flows/qualify-lead-flow';
import { doc, collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Bot, Zap, Star, ShieldCheck, TrendingUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const AnalysisItem = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-slate-800">{title}</h4>
            <p className="text-sm text-slate-600">{content}</p>
        </div>
    </div>
);

export default function LeadAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const leadId = params.leadId as string;
    const firestore = useFirestore();
    const { toast } = useToast();

    const [analysis, setAnalysis] = useState<QualifyLeadOutput | null>(null);
    const [loading, setLoading] = useState(true);

    const leadDocRef = useMemo(() => (firestore && leadId ? doc(firestore, 'leads', leadId) : null), [firestore, leadId]);
    const { data: lead, loading: leadLoading } = useDoc<Lead>(leadDocRef);

    const notesQuery = useMemo(() => {
        if (!firestore || !leadId) return null;
        return query(collection(firestore, 'leads', leadId, 'noteHistory'), orderBy('date', 'asc'));
    }, [firestore, leadId]);
    const { data: noteHistory, loading: notesLoading } = useCollection<NoteEntry>(notesQuery);

    useEffect(() => {
        if (lead && noteHistory && !leadLoading && !notesLoading) {
            setLoading(true);
            const leadDetails = JSON.stringify(lead);
            const conversationHistory = JSON.stringify(noteHistory.map(n => `[${n.author} at ${n.date.toString()}]: ${n.content}`).join('\n')));
            
            qualifyLead({ leadDetails, conversationHistory })
                .then(async (result) => {
                    setAnalysis(result);
                    if (leadDocRef && result.leadStatus) {
                        try {
                            await updateDoc(leadDocRef, { leadStatus: result.leadStatus as LeadStatus });
                            toast({
                                title: "Lead Status Updated",
                                description: `AI classified this lead as ${result.leadStatus}.`
                            });
                        } catch (error) {
                            console.error("Failed to update lead status:", error);
                            toast({
                                title: "Update Failed",
                                description: "Could not save the AI analysis result to the lead.",
                                variant: "destructive"
                            });
                        }
                    }
                })
                .catch((error) => {
                    console.error("AI analysis failed:", error);
                    toast({
                        title: "AI Analysis Failed",
                        description: "Could not generate AI analysis for this lead.",
                        variant: "destructive"
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [lead, noteHistory, leadLoading, notesLoading, leadDocRef, toast]);
    
    const renderContent = () => {
        if (loading || leadLoading) {
            return (
                <div className="space-y-6">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-24 w-full" />
                       <Skeleton className="h-24 w-full" />
                    </div>
                     <Skeleton className="h-24 w-full" />
                </div>
            );
        }

        if (!analysis) {
            return <p>No analysis data available.</p>;
        }
        
        const statusColors = {
            Hot: 'bg-red-100 text-red-800',
            Warm: 'bg-orange-100 text-orange-800',
            'In Nurturing': 'bg-yellow-100 text-yellow-800',
            Cold: 'bg-blue-100 text-blue-800',
        };

        const qualificationColors = {
            Qualified: 'bg-green-100 text-green-800',
            'Not Qualified': 'bg-slate-100 text-slate-800',
        }

        return (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between p-6 bg-slate-50 rounded-2xl border">
                    <div>
                        <p className="text-sm font-semibold text-slate-500">AI Qualification Analysis</p>
                        <h3 className="text-2xl font-bold text-slate-900">Lead: {lead?.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg text-sm font-bold ${statusColors[analysis.leadStatus] || 'bg-gray-100'}`}>
                           {analysis.leadStatus} ({analysis.totalScore} pts)
                        </div>
                         <div className={`px-4 py-2 rounded-lg text-sm font-bold ${qualificationColors[analysis.qualificationDecision]}`}>
                           {analysis.qualificationDecision}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-semibold mb-4">BANT Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <AnalysisItem icon={<Zap size={16} />} title="Budget" content={analysis.budget} />
                       <AnalysisItem icon={<Users size={16} />} title="Authority" content={analysis.authority} />
                       <AnalysisItem icon={<Star size={16} />} title="Need" content={analysis.need} />
                       <AnalysisItem icon={<TrendingUp size={16} />} title="Timing" content={analysis.timing} />
                    </div>
                </div>
                
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-800">
                            <Lightbulb size={20} />
                            Sales Recommendation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-blue-900">{analysis.salesRecommendation}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <main className="flex flex-1 flex-col">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.push('/leads')}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h3 className="text-xl font-bold">AI Lead Analysis</h3>
                    <div className="text-sm text-muted-foreground">
                        For lead: {lead?.name || <Skeleton className="h-4 w-32 inline-block" />}
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl border p-6 md:p-8">
                {renderContent()}
            </div>
        </main>
    );
}
