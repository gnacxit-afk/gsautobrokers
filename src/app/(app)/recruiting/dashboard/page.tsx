'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, BadgePercent, Clock } from 'lucide-react';
import { differenceInDays, isValid } from 'date-fns';
import { KanbanBoard } from '../components/kanban-board';

const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: string, icon: React.ElementType, loading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

export default function RecruitingDashboard() {
    const firestore = useFirestore();
    const candidatesQuery = useMemo(() => firestore ? collection(firestore, 'candidates') : null, [firestore]);
    const { data: candidates, loading } = useCollection<Candidate>(candidatesQuery);

    const metrics = useMemo(() => {
        if (!candidates || candidates.length === 0) {
            return {
                totalCandidates: 0,
                approvalPercentage: 0,
                activationPercentage: 0,
                avgActivationTime: 0,
            };
        }

        const totalCandidates = candidates.length;
        const approvedOrBetter = candidates.filter(c => ['Approved', 'Onboarding', 'Active'].includes(c.pipelineStatus));
        const activeCandidates = candidates.filter(c => c.pipelineStatus === 'Active');

        const approvalPercentage = totalCandidates > 0 ? (approvedOrBetter.length / totalCandidates) * 100 : 0;
        const activationPercentage = totalCandidates > 0 ? (activeCandidates.length / totalCandidates) * 100 : 0;

        const activationTimes = activeCandidates
            .map(c => {
                const applied = (c.appliedDate as any)?.toDate ? (c.appliedDate as any).toDate() : new Date(c.appliedDate as string);
                const activated = (c.lastStatusChangeDate as any)?.toDate ? (c.lastStatusChangeDate as any).toDate() : new Date(c.lastStatusChangeDate as string);
                if (isValid(applied) && isValid(activated)) {
                    return differenceInDays(activated, applied);
                }
                return null;
            })
            .filter((d): d is number => d !== null && d >= 0);
        
        const avgActivationTime = activationTimes.length > 0
            ? activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length
            : 0;

        return {
            totalCandidates,
            approvalPercentage,
            activationPercentage,
            avgActivationTime,
        };
    }, [candidates]);

    return (
        <main className="flex-1 space-y-6">
            <h1 className="text-2xl font-bold">Recruiting Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Candidates" value={`${metrics.totalCandidates}`} icon={Users} loading={loading} />
                <StatCard title="Approval Percentage" value={`${metrics.approvalPercentage.toFixed(1)}%`} icon={UserCheck} loading={loading} />
                <StatCard title="Activation Percentage" value={`${metrics.activationPercentage.toFixed(1)}%`} icon={BadgePercent} loading={loading} />
                <StatCard title="Avg. Activation Time (Days)" value={`${metrics.avgActivationTime.toFixed(1)}`} icon={Clock} loading={loading} />
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold">Candidate Pipeline</h2>
                <KanbanBoard candidates={candidates || []} isLoading={loading} />
            </div>
            
        </main>
    );
}
