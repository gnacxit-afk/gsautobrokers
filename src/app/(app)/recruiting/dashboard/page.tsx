
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, BadgePercent, Clock, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { differenceInDays, isValid } from 'date-fns';

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
                pipelineData: [],
                topRecruiter: { name: 'N/A', conversionRate: 0 },
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
                    return differenceInDays(activated, activated);
                }
                return null;
            })
            .filter((d): d is number => d !== null && d >= 0);
        
        const avgActivationTime = activationTimes.length > 0
            ? activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length
            : 0;

        const pipelineStatusOrder = ['New Applicant', 'Pre-Filter Approved', '5-Minute Filter', 'Approved', 'Onboarding', 'Active', 'Rejected', 'Inactive'];
        const pipelineCounts = candidates.reduce((acc, c) => {
            acc[c.pipelineStatus] = (acc[c.pipelineStatus] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const pipelineData = pipelineStatusOrder.map(status => ({
            status,
            count: pipelineCounts[status] || 0,
        }));

        const recruiters = candidates.reduce((acc, c) => {
            if (c.approvedBy) {
                if (!acc[c.approvedBy]) {
                    acc[c.approvedBy] = { total: 0, active: 0 };
                }
                acc[c.approvedBy].total++;
                if (c.pipelineStatus === 'Active') {
                    acc[c.approvedBy].active++;
                }
            }
            return acc;
        }, {} as Record<string, { total: number, active: number }>);

        let topRecruiter = { name: 'N/A', conversionRate: 0 };
        Object.entries(recruiters).forEach(([name, data]) => {
            if (data.total > 0) {
                const conversionRate = (data.active / data.total) * 100;
                if (conversionRate > topRecruiter.conversionRate) {
                    topRecruiter = { name, conversionRate };
                }
            }
        });

        return {
            totalCandidates,
            approvalPercentage,
            activationPercentage,
            avgActivationTime,
            pipelineData,
            topRecruiter,
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Candidate Pipeline Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? (
                            <Skeleton className="h-[350px] w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={metrics.pipelineData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} interval={0} fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Top Recruiter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-6 w-1/2" />
                            </div>
                        ) : (
                            <div className="text-center space-y-2 pt-8">
                                <div className="text-2xl font-bold">{metrics.topRecruiter.name}</div>
                                <p className="text-muted-foreground">with a</p>
                                <div className="text-4xl font-bold text-primary">
                                    {metrics.topRecruiter.conversionRate.toFixed(1)}%
                                </div>
                                <p className="text-muted-foreground">Activation Rate</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

    