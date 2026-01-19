'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Lead, Staff, Dealership } from '@/lib/types';
import { useDateRange } from '@/hooks/use-date-range';
import { useAuthContext } from '@/lib/auth';
import { isWithinInterval, isValid, differenceInDays, format, getISOWeek, getMonth, getYear } from 'date-fns';
import { calculateBonus } from '@/lib/utils';
import { REVENUE_PER_VEHICLE, COMMISSION_PER_VEHICLE, MARGIN_PER_VEHICLE } from '@/lib/mock-data';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Percent, Star, Trophy, Building } from 'lucide-react';


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


export default function DashboardPage() {
    const { user } = useAuthContext();
    const firestore = useFirestore();
    const { dateRange } = useDateRange();
    
    const leadsQuery = useMemo(() => firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null, [firestore]);
    const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
    const dealershipsQuery = useMemo(() => firestore ? query(collection(firestore, 'dealerships')) : null, [firestore]);
    
    const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);
    const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(dealershipsQuery);


    const loading = leadsLoading || staffLoading || dealershipsLoading;

    const filteredLeads = useMemo(() => {
        if (!leads) return [];
        return leads.filter(l => {
            if (!l.createdAt) return false;
            const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
            if (!isValid(leadDate)) return false;
            return isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end });
        });
    }, [leads, dateRange]);

    const salesMetrics = useMemo(() => {
        const closedSales = filteredLeads.filter(l => l.stage === 'Ganado').length;
        const totalLeads = filteredLeads.length;
        const totalRevenue = closedSales * REVENUE_PER_VEHICLE;
        const grossMargin = closedSales * MARGIN_PER_VEHICLE;
        const totalCommissions = closedSales * COMMISSION_PER_VEHICLE;
        
        let totalBonuses = 0;
        if (staff) {
            const salesByOwner = filteredLeads
                .filter(l => l.stage === 'Ganado')
                .reduce((acc, lead) => {
                    acc[lead.ownerId] = (acc[lead.ownerId] || 0) + 1;
                    return acc;
                }, {} as { [key: string]: number });
            
            totalBonuses = Object.values(salesByOwner).reduce((acc, sales) => acc + calculateBonus(sales), 0);
        }

        const totalToPay = totalCommissions + totalBonuses;
        const conversionRate = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;

        return {
            totalRevenue,
            grossMargin,
            totalToPay,
            totalCommissions,
            totalBonuses,
            totalLeads,
            closedSales,
            conversionRate
        }
    }, [filteredLeads, staff]);

    const salesAndLeadsTrend = useMemo(() => {
        if (filteredLeads.length === 0) return [];
    
        const duration = differenceInDays(dateRange.end, dateRange.start);
        let groupingFormat: (date: Date) => string;
        let labelFormat: (date: Date) => string;
    
        if (duration <= 31) { // Group by day
            groupingFormat = (date) => format(date, 'yyyy-MM-dd');
            labelFormat = (date) => format(date, 'd MMM');
        } else if (duration <= 180) { // Group by week
            groupingFormat = (date) => `${getYear(date)}-${getISOWeek(date)}`;
            labelFormat = (date) => `W${getISOWeek(date)}`;
        } else { // Group by month
            groupingFormat = (date) => format(date, 'yyyy-MM');
            labelFormat = (date) => format(date, 'MMM yyyy');
        }
    
        const groupedData = filteredLeads.reduce((acc, lead) => {
            const date = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as string);
            if (!isValid(date)) return acc;
    
            const key = groupingFormat(date);
            if (!acc[key]) {
                acc[key] = { name: date, leads: 0, sales: 0 };
            }
            acc[key].leads++;
            if (lead.stage === 'Ganado') {
                acc[key].sales++;
            }
            return acc;
        }, {} as Record<string, { name: Date; leads: number; sales: number }>);
    
        return Object.values(groupedData)
            .map(data => ({
                ...data,
                name: labelFormat(data.name),
                // Add a sortable key to keep chronological order
                sortKey: data.name.getTime(),
            }))
            .sort((a, b) => a.sortKey - b.sortKey);
    
    }, [filteredLeads, dateRange]);


    const sellerPerformanceData = useMemo(() => {
        if (!staff) return [];
        const brokers = staff.filter(s => s.role === 'Broker');

        return brokers.map(broker => {
            const brokerLeads = filteredLeads.filter(l => l.ownerId === broker.id);
            const totalLeads = brokerLeads.length;
            const sales = brokerLeads.filter(l => l.stage === 'Ganado').length;
            const conversion = totalLeads > 0 ? (sales / totalLeads) * 100 : 0;
            const commissions = sales * COMMISSION_PER_VEHICLE;
            const bonus = calculateBonus(sales);
            const totalToPay = commissions + bonus;

            const leadsByStage = brokerLeads.reduce((acc, lead) => {
                acc[lead.stage] = (acc[lead.stage] || 0) + 1;
                return acc;
            }, {} as Record<Lead['stage'], number>);

            return {
                id: broker.id,
                name: broker.name,
                leads: totalLeads,
                sales,
                conversion,
                commissions,
                bonus,
                totalToPay,
                ...leadsByStage,
            };
        }).sort((a, b) => b.sales - a.sales);
    }, [filteredLeads, staff]);

    const channelConversion = useMemo(() => {
        const channels = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];
        return channels.map(channel => {
            const channelLeads = filteredLeads.filter(l => l.channel === channel);
            const total = channelLeads.length;
            const sales = channelLeads.filter(l => l.stage === 'Ganado').length;
            const conversion = total > 0 ? (sales / total) * 100 : 0;
            return { channel, total, sales, conversion: `${conversion.toFixed(1)}%` };
        });
    }, [filteredLeads]);
    
     const executiveSummary = useMemo(() => {
        if (!filteredLeads.length || !staff) {
            return {
                mostProfitableChannel: 'N/A',
                topSeller: 'N/A',
                laggingSeller: 'N/A',
                stageCounts: {},
            };
        }

        const sales = filteredLeads.filter(l => l.stage === 'Ganado');
        const channelSales = sales.reduce((acc, lead) => {
            acc[lead.channel] = (acc[lead.channel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const mostProfitableChannel = Object.entries(channelSales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        const sellerSales = sellerPerformanceData.filter(s => staff.find(st => st.id === s.id)?.role === 'Broker');
        const topSeller = sellerSales.length > 0 ? sellerSales[0].name : 'N/A';
        const laggingSeller = sellerSales.length > 0 ? sellerSales[sellerSales.length - 1].name : 'N/A';

        const stageCounts = filteredLeads.reduce((acc, lead) => {
            acc[lead.stage] = (acc[lead.stage] || 0) + 1;
            return acc;
        }, {} as Record<Lead['stage'], number>);
        
        return { mostProfitableChannel, topSeller, laggingSeller, stageCounts };

    }, [filteredLeads, staff, sellerPerformanceData]);

    const salesByDealership = useMemo(() => {
        if (!dealerships || !filteredLeads) return [];
        const sales = filteredLeads.filter(l => l.stage === 'Ganado');
        const byDealership = sales.reduce((acc, lead) => {
            const name = lead.dealershipName || 'Unknown';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(byDealership)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales);
    }, [filteredLeads, dealerships]);


    return (
        <main className="flex-1 space-y-6">
             <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Sales Dashboard</h1>
                    <p className="text-muted-foreground">An overview of your sales performance.</p>
                </div>
                <DateRangePicker />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Revenue" value={`$${salesMetrics.totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-green-500" loading={loading} />
                <StatCard title="Gross Margin" value={`$${salesMetrics.grossMargin.toLocaleString()}`} icon={TrendingUp} color="text-blue-500" loading={loading} />
                <StatCard title="Total to Pay" value={`$${salesMetrics.totalToPay.toLocaleString()}`} icon={TrendingDown} color="text-red-500" loading={loading} />
                <StatCard title="Total Leads" value={`${salesMetrics.totalLeads}`} icon={Users} color="text-indigo-500" loading={loading} />
                <StatCard title="Closed Sales" value={`${salesMetrics.closedSales}`} icon={Target} color="text-amber-500" loading={loading} />
                <StatCard title="Conversion Rate" value={`${salesMetrics.conversionRate.toFixed(1)}%`} icon={Percent} color="text-violet-500" loading={loading} />
                <StatCard title="Total Commissions" value={`$${salesMetrics.totalCommissions.toLocaleString()}`} icon={DollarSign} color="text-cyan-500" loading={loading} />
                <StatCard title="Total Bonuses" value={`$${salesMetrics.totalBonuses.toLocaleString()}`} icon={DollarSign} color="text-pink-500" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales & Leads Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={salesAndLeadsTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} />
                                    <Line type="monotone" dataKey="sales" stroke="hsl(var(--accent))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle>Channel Conversion</CardTitle>
                        <CardDescription>Performance of each lead acquisition channel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Channel</TableHead>
                                    <TableHead className="text-right">Leads</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right">Conversion</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                )) : channelConversion.map(c => (
                                    <TableRow key={c.channel}>
                                        <TableCell className="font-medium">{c.channel}</TableCell>
                                        <TableCell className="text-right">{c.total}</TableCell>
                                        <TableCell className="text-right">{c.sales}</TableCell>
                                        <TableCell className="text-right font-semibold">{c.conversion}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Sales by Dealership</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={salesByDealership} layout="vertical" margin={{ left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={100} />
                                    <Tooltip />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" name="Sales" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
            
             <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Seller Performance</CardTitle>
                        <CardDescription>Lead distribution and financial performance by broker for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {loading ? <Skeleton className="h-[300px] w-full" /> : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={sellerPerformanceData} layout="vertical" stackOffset="expand">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" hide={true} />
                                    <YAxis type="category" dataKey="name" fontSize={12} width={80} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Nuevo" stackId="a" fill="#94a3b8" name="Nuevo" />
                                    <Bar dataKey="En Seguimiento" stackId="a" fill="#f97316" name="En Seguimiento" />
                                    <Bar dataKey="Citado" stackId="a" fill="#facc15" name="Citado" />
                                    <Bar dataKey="Ganado" stackId="a" fill="#22c55e" name="Ganado" />
                                    <Bar dataKey="Perdido" stackId="a" fill="#ef4444" name="Perdido" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Broker</TableHead>
                                    <TableHead className="text-right">Leads</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right">Conversion</TableHead>
                                    <TableHead className="text-right">Commissions</TableHead>
                                    <TableHead className="text-right">Bonus</TableHead>
                                    <TableHead className="text-right font-bold">Total to Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? [...Array(3)].map((_, i) => (
                                     <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                )) : sellerPerformanceData.map(broker => (
                                    <TableRow key={broker.id}>
                                        <TableCell className="font-medium">{broker.name}</TableCell>
                                        <TableCell className="text-right">{broker.leads}</TableCell>
                                        <TableCell className="text-right font-semibold">{broker.sales}</TableCell>
                                        <TableCell className="text-right">{broker.conversion.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right">${broker.commissions.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">${broker.bonus.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">${broker.totalToPay.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Executive Summary</CardTitle>
                        <CardDescription>Key performance indicators for the selected period.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {loading ? <Skeleton className="h-[200px] w-full" /> : (
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-semibold text-slate-500">Most Profitable Channel</TableCell>
                                        <TableCell><Badge variant="secondary">{executiveSummary.mostProfitableChannel}</Badge></TableCell>
                                        <TableCell className="font-semibold text-slate-500">Total Nuevo</TableCell>
                                        <TableCell className="font-bold">{executiveSummary.stageCounts.Nuevo || 0}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell className="font-semibold text-slate-500">Top Seller</TableCell>
                                        <TableCell><Badge variant="outline" className="text-green-600 border-green-300"><Trophy size={14} className="mr-1.5"/>{executiveSummary.topSeller}</Badge></TableCell>
                                        <TableCell className="font-semibold text-slate-500">Total Calificado</TableCell>
                                        <TableCell className="font-bold">{executiveSummary.stageCounts.Calificado || 0}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell className="font-semibold text-slate-500">Lagging Seller</TableCell>
                                        <TableCell><Badge variant="outline" className="text-red-600 border-red-300">{executiveSummary.laggingSeller}</Badge></TableCell>
                                        <TableCell className="font-semibold text-slate-500">Total de Citas</TableCell>
                                        <TableCell className="font-bold">{executiveSummary.stageCounts.Citado || 0}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="font-semibold text-slate-500">Total en Seguimiento</TableCell>
                                        <TableCell className="font-bold">{executiveSummary.stageCounts['En Seguimiento'] || 0}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="font-semibold text-slate-500">Total de Ventas</TableCell>
                                        <TableCell className="font-bold text-green-600">{executiveSummary.stageCounts.Ganado || 0}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell></TableCell>
                                        <TableCell></TableCell>
                                        <TableCell className="font-semibold text-slate-500">Total Perdido</TableCell>
                                        <TableCell className="font-bold text-red-600">{executiveSummary.stageCounts.Perdido || 0}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                         )}
                    </CardContent>
                </Card>
            </div>

        </main>
    );

    
}

    