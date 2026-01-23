
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Lead, Staff, Dealership, Vehicle } from '@/lib/types';
import { useDateRange } from '@/hooks/use-date-range';
import { useAuthContext } from '@/lib/auth';
import { isWithinInterval, isValid, differenceInDays, format, getISOWeek, getMonth, getYear } from 'date-fns';
import { calculateBonus } from '@/lib/utils';
import { DateRangePicker } from '@/components/layout/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Percent, Star, Trophy, Building, Lock } from 'lucide-react';


const StatCard = ({ title, value, change, icon: Icon, color, loading }: { title: string, value: string, change?: string, icon: React.ElementType, color: string, loading: boolean }) => (
    <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{value}</div>}
            {change && !loading && <p className="text-xs text-slate-400">{change}</p>}
        </CardContent>
    </Card>
);

const AdminDashboard = ({ loading, filteredLeads, allStaff, allDealerships, allVehicles }: { loading: boolean, filteredLeads: Lead[], allStaff: Staff[], allDealerships: Dealership[], allVehicles: Vehicle[] }) => {
    
    const supervisors = useMemo(() => allStaff.filter(s => s.role === 'Supervisor'), [allStaff]);

    const salesMetrics = useMemo(() => {
        const closedSales = filteredLeads.filter(l => l.stage === 'Ganado');
        const totalRevenue = closedSales.reduce((acc, lead) => {
            const vehicle = allVehicles.find(v => v.id === lead.interestedVehicleId);
            return acc + (vehicle?.commission || 0);
        }, 0);

        const totalCommissions = closedSales.reduce((acc, lead) => acc + (lead.brokerCommission || 0), 0);
        
        const salesByOwner = closedSales.reduce((acc, lead) => {
            acc[lead.ownerId] = (acc[lead.ownerId] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
            
        const totalBonuses = Object.values(salesByOwner).reduce((acc, sales) => acc + calculateBonus(sales), 0);

        return {
            totalRevenue,
            totalCommissions,
            totalBonuses,
            totalLeads: filteredLeads.length,
            closedSalesCount: closedSales.length,
            conversionRate: filteredLeads.length > 0 ? (closedSales.length / filteredLeads.length) * 100 : 0
        };
    }, [filteredLeads, allVehicles]);

    const supervisorPerformance = useMemo(() => {
        return supervisors.map(supervisor => {
            const teamMembers = allStaff.filter(s => s.supervisorId === supervisor.id);
            const teamIds = teamMembers.map(s => s.id);
            const supervisorSales = filteredLeads.filter(l => l.stage === 'Ganado' && l.ownerId === supervisor.id).length;
            const teamSales = filteredLeads.filter(l => l.stage === 'Ganado' && teamIds.includes(l.ownerId));
            
            let overrideCommission = 0;
            if (supervisorSales >= 5) {
                overrideCommission = teamSales.reduce((acc, lead) => {
                    const vehicle = allVehicles.find(v => v.id === lead.interestedVehicleId);
                    return acc + ((vehicle?.commission || 0) * 0.05);
                }, 0);
            }

            return {
                id: supervisor.id,
                name: supervisor.name,
                personalSales: supervisorSales,
                teamSales: teamSales.length,
                overrideCommission
            };
        });
    }, [supervisors, allStaff, filteredLeads, allVehicles]);

    const totalOverridePayouts = supervisorPerformance.reduce((acc, s) => acc + s.overrideCommission, 0);

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`$${salesMetrics.totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-500" loading={loading} />
                <StatCard title="Total Leads" value={`${salesMetrics.totalLeads}`} icon={Users} color="text-indigo-500" loading={loading} />
                <StatCard title="Closed Sales" value={`${salesMetrics.closedSalesCount}`} icon={Target} color="text-amber-500" loading={loading} />
                <StatCard title="Conversion Rate" value={`${salesMetrics.conversionRate.toFixed(1)}%`} icon={Percent} color="text-violet-500" loading={loading} />
                <StatCard title="Total Broker Commissions" value={`$${salesMetrics.totalCommissions.toLocaleString()}`} icon={TrendingUp} color="text-cyan-500" loading={loading} />
                <StatCard title="Total Bonuses" value={`$${salesMetrics.totalBonuses.toLocaleString()}`} icon={Star} color="text-pink-500" loading={loading} />
                <StatCard title="Total Override Payouts" value={`$${totalOverridePayouts.toLocaleString()}`} icon={TrendingDown} color="text-red-500" loading={loading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Supervisor Performance</CardTitle>
                    <CardDescription>Performance metrics for supervisors and their teams.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Supervisor</TableHead>
                                <TableHead className="text-right">Personal Sales</TableHead>
                                <TableHead className="text-right">Team Sales</TableHead>
                                <TableHead className="text-right">5% Override Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loading ? [...Array(3)].map((_, i) => (
                                 <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            )) : supervisorPerformance.map(s => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell className="text-right">{s.personalSales}</TableCell>
                                    <TableCell className="text-right">{s.teamSales}</TableCell>
                                    <TableCell className="text-right font-bold">${s.overrideCommission.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}

const SupervisorDashboard = ({ user, loading, filteredLeads, allStaff, allVehicles }: { user: Staff, loading: boolean, filteredLeads: Lead[], allStaff: Staff[], allVehicles: Vehicle[] }) => {
    const teamMembers = useMemo(() => allStaff.filter(s => s.supervisorId === user.id), [allStaff, user]);
    const teamIds = useMemo(() => teamMembers.map(s => s.id), [teamMembers]);

    const personalSales = useMemo(() => filteredLeads.filter(l => l.stage === 'Ganado' && l.ownerId === user.id), [filteredLeads, user]);
    const teamSales = useMemo(() => filteredLeads.filter(l => l.stage === 'Ganado' && teamIds.includes(l.ownerId)), [filteredLeads, teamIds]);

    const personalCommissions = useMemo(() => personalSales.reduce((acc, lead) => acc + (lead.brokerCommission || 0), 0), [personalSales]);
    const personalBonus = useMemo(() => calculateBonus(personalSales.length), [personalSales]);
    const personalTotalEarnings = personalCommissions + personalBonus;
    
    const overrideUnlocked = personalSales.length >= 5;
    const overrideCommission = useMemo(() => {
        if (!overrideUnlocked) return 0;
        return teamSales.reduce((acc, lead) => {
            const vehicle = allVehicles.find(v => v.id === lead.interestedVehicleId);
            return acc + ((vehicle?.commission || 0) * 0.05);
        }, 0);
    }, [teamSales, overrideUnlocked, allVehicles]);
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><CardTitle>Personal Sales</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <StatCard title="Your Sales" value={`${personalSales.length}`} icon={Target} color="text-green-500" loading={loading} />
                        <StatCard title="Your Commissions" value={`$${personalCommissions.toLocaleString()}`} icon={DollarSign} color="text-blue-500" loading={loading} />
                        <StatCard title="Your Bonus" value={`$${personalBonus.toLocaleString()}`} icon={Star} color="text-yellow-500" loading={loading} />
                         <div className="border-t pt-4">
                            <p className="text-sm font-medium text-slate-500">Total Personal Earnings</p>
                            <p className="text-2xl font-bold">${personalTotalEarnings.toLocaleString()}</p>
                         </div>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                        <CardDescription>Metrics for the brokers you supervise.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <StatCard title="Team Sales" value={`${teamSales.length}`} icon={Users} color="text-indigo-500" loading={loading} />
                        
                        <div className={`p-4 rounded-lg border ${overrideUnlocked ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                             <h4 className="font-semibold flex items-center gap-2">{!overrideUnlocked && <Lock size={16} />} Override Commission (5%)</h4>
                             <p className="text-xs text-muted-foreground mb-2">You need 5 personal sales to unlock this commission.</p>
                             <p className="text-3xl font-bold">${overrideCommission.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


export default function DashboardPage() {
    const { user } = useAuthContext();
    const firestore = useFirestore();
    const { dateRange } = useDateRange();
    
    const leadsQuery = useMemo(() => firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
    const dealershipsQuery = useMemo(() => firestore ? query(collection(firestore, 'dealerships')) : null, [firestore]);
    const vehiclesQuery = useMemo(() => firestore ? collection(firestore, 'inventory') : null, [firestore]);

    const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);
    const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(dealershipsQuery);
    const { data: vehicles, loading: vehiclesLoading } = useCollection<Vehicle>(vehiclesQuery);

    const loading = leadsLoading || staffLoading || dealershipsLoading || vehiclesLoading;

    const filteredLeads = useMemo(() => {
        if (!leads) return [];
        return leads.filter(l => {
            if (!l.createdAt) return false;
            const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
            if (!isValid(leadDate)) return false;
            return isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end });
        });
    }, [leads, dateRange]);
    
    const renderContent = () => {
        if (!user) return <Skeleton className="h-screen w-full" />;

        switch (user.role) {
            case 'Admin':
                return <AdminDashboard loading={loading} filteredLeads={filteredLeads} allStaff={staff || []} allDealerships={dealerships || []} allVehicles={vehicles || []} />;
            case 'Supervisor':
                 return <SupervisorDashboard user={user} loading={loading} filteredLeads={filteredLeads} allStaff={staff || []} allVehicles={vehicles || []} />;
            case 'Broker':
                // Broker Dashboard logic could go here, or redirect
                 return <p>Broker dashboard coming soon.</p>;
            default:
                return <p>No dashboard available for your role.</p>;
        }
    }

    return (
        <main className="flex-1 space-y-6">
             <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Sales Dashboard</h1>
                    <p className="text-muted-foreground">An overview of sales performance.</p>
                </div>
                <DateRangePicker />
            </div>
            {renderContent()}
        </main>
    );
}
