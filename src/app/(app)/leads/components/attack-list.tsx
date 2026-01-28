'use client';

import { useMemo } from 'react';
import type { Lead, Appointment } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, Calendar, Clock, Star } from 'lucide-react';
import { differenceInHours, isToday, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface AttackListProps {
  leads: Lead[];
  appointments: Appointment[];
  loading: boolean;
}

const PriorityItem = ({ lead, reason, icon: Icon }: { lead: Lead, reason: string, icon: React.ElementType }) => (
    <Link href={`/leads/${lead.id}/notes`} className="block p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                    <p className="font-semibold text-sm">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{reason}</p>
                </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{lead.ownerName}</p>
        </div>
    </Link>
);


export function AttackList({ leads, appointments, loading }: AttackListProps) {

    const priorityLeads = useMemo(() => {
        const now = new Date();
        const scoredLeads: (Lead & { score: number, reason: string, icon: React.ElementType })[] = [];

        const leadsWithAppointmentsToday = appointments
            .filter(a => isToday(a.startTime.toDate()))
            .map(a => a.leadId);

        leads.forEach(lead => {
            let score = 0;
            let reason = '';
            let icon: React.ElementType = Star;

            const timeInStage = differenceInHours(now, (lead.lastActivity as any)?.toDate() || (lead.createdAt as any)?.toDate());

            // Priority 1: Appointment today
            if (leadsWithAppointmentsToday.includes(lead.id)) {
                score = 100;
                reason = "Appointment scheduled for today.";
                icon = Calendar;
            }
            // Priority 2: Stale leads
            else if (timeInStage > 72 && lead.stage !== 'Ganado' && lead.stage !== 'Perdido') {
                score = 80 + timeInStage; // Higher score for older leads
                reason = `Stuck in ${lead.stage} for ${Math.floor(timeInStage / 24)} days.`;
                icon = AlertTriangle;
            }
            // Priority 3: New leads
            else if (lead.stage === 'Nuevo') {
                score = 60;
                reason = 'New lead, needs first contact.';
                icon = Star;
            }
            // Priority 4: Stale follow-ups
            else if (lead.stage === 'En Seguimiento' && timeInStage > 48) {
                score = 50 + timeInStage;
                reason = `Needs follow-up (last activity ${Math.floor(timeInStage / 24)} days ago).`;
                icon = Clock;
            }
            
            if (score > 0) {
                 scoredLeads.push({ ...lead, score, reason, icon });
            }
        });

        return scoredLeads.sort((a, b) => b.score - a.score).slice(0, 5);

    }, [leads, appointments]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Lista de Ataque (Prioridades)</CardTitle>
            </CardHeader>
            <CardContent>
                 {priorityLeads.length > 0 ? (
                    <div className="space-y-1">
                        {priorityLeads.map(lead => (
                            <PriorityItem key={lead.id} lead={lead} reason={lead.reason} icon={lead.icon} />
                        ))}
                    </div>
                 ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">No priority actions found. Great job!</p>
                 )}
            </CardContent>
        </Card>
    )
}
