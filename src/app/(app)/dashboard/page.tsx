
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Lead, Staff, Dealership, Vehicle } from '@/lib/types';
import { useDateRange } from '@/hooks/use-date-range';
import { useAuthContext } from '@/lib/auth';
import { isWithinInterval, isValid, differenceInDays, format, getISOWeek, getMonth, getYear, parseISO, startOfDay, endOfDay } from 'date-fns';
import { calculateBonus } from '@/lib/utils';
import { DateRangePicker } from '@/components/layout/date-range-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Percent, Star, Trophy, Building, Lock, Briefcase, FileText, Share2, Activity } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


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

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


const AdminDashboard = ({ loading, filteredLeads, allStaff, allDealerships, allVehicles, dateRange }: { loading: boolean, filteredLeads: Lead[], allStaff: Staff[], allDealerships: Dealership[], allVehicles: Vehicle[], dateRange: { start: Date, end: Date } }) => {
    
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

    const totalOverridePayouts = useMemo(() => supervisorPerformance.reduce((acc, s) => acc + s.overrideCommission, 0), [supervisorPerformance]);
    const totalToPay = useMemo(() => salesMetrics.totalCommissions + salesMetrics.totalBonuses + totalOverridePayouts, [salesMetrics, totalOverridePayouts]);

    const salesAndLeadsData = useMemo(() => {
        const days = differenceInDays(dateRange.end, dateRange.start);
        let dataMap: Map<string, { date: string, leads: number, sales: number }> = new Map();

        const getGroupKey = (date: Date) => {
            if (days <= 31) return format(date, 'yyyy-MM-dd');
            if (days <= 365) return `${getYear(date)}-W${getISOWeek(date)}`;
            return format(date, 'yyyy-MM');
        };

        filteredLeads.forEach(lead => {
            const date = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as string);
            if (!isValid(date)) return;

            const key = getGroupKey(date);
            if (!dataMap.has(key)) dataMap.set(key, { date: key, leads: 0, sales: 0 });

            const entry = dataMap.get(key)!;
            entry.leads++;
            if (lead.stage === 'Ganado') entry.sales++;
        });

        return Array.from(dataMap.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredLeads, dateRange]);

    const sellerPerformance = useMemo(() => {
        const sellers = allStaff.filter(s => s.role === 'Broker' || s.role === 'Supervisor');
        return sellers.map(seller => {
            const sellerLeads = filteredLeads.filter(l => l.ownerId === seller.id);
            const closedSales = sellerLeads.filter(l => l.stage === 'Ganado');
            return {
                id: seller.id,
                name: seller.name,
                avatarUrl: seller.avatarUrl,
                sales: closedSales.length,
                leads: sellerLeads.length,
                conversionRate: sellerLeads.length > 0 ? (closedSales.length / sellerLeads.length) * 100 : 0
            }
        }).sort((a,b) => b.sales - a.sales);
    }, [allStaff, filteredLeads]);

    const channelPerformance = useMemo(() => {
        const channels = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];
        const channelMap = new Map(channels.map(c => [c, { channel: c, leads: 0, sales: 0 }]));
        filteredLeads.forEach(lead => {
            if(channelMap.has(lead.channel)) {
                const entry = channelMap.get(lead.channel)!;
                entry.leads++;
                if (lead.stage === 'Ganado') entry.sales++;
            }
        });
        return Array.from(channelMap.values()).map(c => ({...c, conversion: c.leads > 0 ? (c.sales / c.leads) * 100 : 0}));
    }, [filteredLeads]);

    const dealershipSales = useMemo(() => {
        const salesByDealership = filteredLeads
            .filter(l => l.stage === 'Ganado')
            .reduce((acc, lead) => {
                const name = lead.dealershipName || 'Unknown';
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {} as {[key: string]: number});
        
        return Object.entries(salesByDealership)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a,b) => b.sales - a.sales);
    }, [filteredLeads]);
    
    const executiveSummary = `During this period, the team generated ${salesMetrics.totalLeads} leads, closing ${salesMetrics.closedSalesCount} of them. This resulted in $${salesMetrics.totalRevenue.toLocaleString()} in revenue for the company from commissions. Total payouts including broker commissions, bonuses, and supervisor overrides amount to $${totalToPay.toLocaleString()}.`;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`$${salesMetrics.totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-500" loading={loading} />
                <StatCard title="Total Leads" value={`${salesMetrics.totalLeads}`} icon={Users} color="text-indigo-500" loading={loading} />
                <StatCard title="Closed Sales" value={`${salesMetrics.closedSalesCount}`} icon={Target} color="text-amber-500" loading={loading} />
                <StatCard title="Conversion Rate" value={`${salesMetrics.conversionRate.toFixed(1)}%`} icon={Percent} color="text-violet-500" loading={loading} />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Broker Commissions" value={`$${salesMetrics.totalCommissions.toLocaleString()}`} icon={TrendingUp} color="text-cyan-500" loading={loading} />
                <StatCard title="Total Bonuses" value={`$${salesMetrics.totalBonuses.toLocaleString()}`} icon={Star} color="text-pink-500" loading={loading} />
                <StatCard title="Total Override Payouts" value={`$${totalOverridePayouts.toLocaleString()}`} icon={TrendingUp} color="text-orange-500" loading={loading} />
                <StatCard title="Total to Pay" value={`$${totalToPay.toLocaleString()}`} icon={DollarSign} color="text-red-500" loading={loading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity size={20} /> Sales & Leads Trend</CardTitle>
                </CardHeader>
                <CardContent>
                     {loading ? <Skeleton className="h-72 w-full" /> : 
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={salesAndLeadsData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0}/>
                                    </linearGradient>
                                     <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{fontSize: '12px', borderRadius: '0.5rem'}} />
                                <Legend wrapperStyle={{fontSize: '14px'}}/>
                                 <Area type="monotone" dataKey="leads" stroke="hsl(var(--chart-2))" fill="url(#colorLeads)" name="Leads" strokeWidth={2} />
                                <Area type="monotone" dataKey="sales" stroke="hsl(var(--chart-1))" fill="url(#colorSales)" name="Sales" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    }
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase size={20} /> Seller Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Seller</TableHead>
                                    <TableHead className="text-right">Leads</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right">Conversion</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                )) : sellerPerformance.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8"><AvatarFallback>{getAvatarFallback(s.name)}</AvatarFallback></Avatar>
                                                <span className="font-medium">{s.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{s.leads}</TableCell>
                                        <TableCell className="text-right font-bold">{s.sales}</TableCell>
                                        <TableCell className="text-right">{s.conversionRate.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText size={20} /> Executive Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-3/4" /></div> : <p className="text-sm text-slate-600">{executiveSummary}</p>}
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Share2 size={20} /> Channel Conversion</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {loading ? <Skeleton className="h-64 w-full" /> : 
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={channelPerformance} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="channel" width={80} tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
                                    <Tooltip contentStyle={{fontSize: '12px', borderRadius: '0.5rem'}} />
                                    <Legend wrapperStyle={{fontSize: '14px'}}/>
                                    <Bar dataKey="leads" fill="hsl(var(--chart-2))" name="Leads" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        }
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Building size={20} /> Sales by Dealership</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {loading ? <Skeleton className="h-64 w-full" /> : 
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={dealershipSales}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{fontSize: '12px', borderRadius: '0.5rem'}} />
                                    <Bar dataKey="sales" fill="hsl(var(--chart-1))" name="Sales" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        }
                    </CardContent>
                </Card>
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
        </div>
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
                return <AdminDashboard loading={loading} filteredLeads={filteredLeads} allStaff={staff || []} allDealerships={dealerships || []} allVehicles={vehicles || []} dateRange={dateRange} />;
            case 'Supervisor':
                 return <SupervisorDashboard user={user} loading={loading} filteredLeads={filteredLeads} allStaff={staff || []} allVehicles={vehicles || []} />;
            case 'Broker':
                // Redirect to KPI page which is the main dashboard for brokers
                // This could be handled with a router.push in a useEffect, but for now a message is fine
                 return <p>Your dashboard is the KPI & Performance page.</p>;
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

