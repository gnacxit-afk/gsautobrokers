'use client';

import { useMemo, useState } from 'react';
import type { Lead } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

const KanbanCard = ({ lead }: { lead: Lead }) => {
    const timeInStage = differenceInHours(new Date(), (lead.lastActivity as any)?.toDate() || (lead.createdAt as any)?.toDate());
    
    const timeIndicatorColor = useMemo(() => {
        if (timeInStage > 72) return 'bg-red-500';
        if (timeInStage > 24) return 'bg-yellow-500';
        return 'bg-green-500';
    }, [timeInStage]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
        e.dataTransfer.setData('leadId', leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <Card 
            className="p-3 mb-3 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => handleDragStart(e, lead.id)}
        >
            <div className="flex justify-between items-start">
                <Link href={`/leads/${lead.id}/notes`} className="font-semibold text-sm hover:underline pr-2">{lead.name}</Link>
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-1", timeIndicatorColor)} title={`Time in stage: ${Math.floor(timeInStage)} hours`}></div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">{getAvatarFallback(lead.ownerName)}</AvatarFallback>
                    </Avatar>
                    <span>{lead.ownerName}</span>
                </div>
                <span>{formatDistanceToNow((lead.lastActivity as any)?.toDate() || (lead.createdAt as any)?.toDate(), { addSuffix: true })}</span>
            </div>
        </Card>
    )
};

interface KanbanBoardProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: Lead['stage']) => void;
  loading: boolean;
}

export function KanbanBoard({ leads, onStageChange, loading }: KanbanBoardProps) {
    const [dragOverColumn, setDragOverColumn] = useState<Lead['stage'] | null>(null);
    
    const leadsByStage = useMemo(() => {
        const grouped: Record<string, Lead[]> = {};
        leadStages.forEach(stage => grouped[stage] = []);
        leads.forEach(lead => {
            if(grouped[lead.stage]) {
                grouped[lead.stage].push(lead);
            }
        });
        return grouped;
    }, [leads]);
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: Lead['stage']) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');
        onStageChange(leadId, stage);
        setDragOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    if (loading) {
        return (
            <div className="grid grid-cols-6 gap-4">
                {leadStages.map(stage => (
                    <div key={stage} className="p-2 bg-slate-100 rounded-lg">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-20 w-full mb-2" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
            {leadStages.map(stage => (
                <div
                    key={stage}
                    className={cn("h-full min-h-[200px] bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 transition-colors", {
                        "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400": dragOverColumn === stage,
                    })}
                    onDrop={(e) => handleDrop(e, stage)}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDragOverColumn(stage)}
                    onDragLeave={() => setDragOverColumn(null)}
                >
                    <h3 className="font-bold text-sm mb-4 px-1">{stage} ({leadsByStage[stage].length})</h3>
                    <div className="space-y-3">
                        {leadsByStage[stage].map(lead => (
                            <KanbanCard key={lead.id} lead={lead} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
