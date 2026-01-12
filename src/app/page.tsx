
'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { REVENUE_PER_VEHICLE, COMMISSION_PER_VEHICLE, MARGIN_PER_VEHICLE } from "@/lib/mock-data";
import { useDateRange } from '@/hooks/use-date-range';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { Users, BarChart3, TrendingUp, DollarSign, Percent, Target, Briefcase, HandCoins, PiggyBank, Wallet } from "lucide-react";
import type { Lead, Staff } from '@/lib/types';
import { calculateBonus } from '@/lib/utils';
import { collection } from 'firebase/firestore';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, eachDayOfInterval, isValid } from 'date-fns';

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: React.ElementType, color: string }) => {
  const colors: { [key: string]: string } = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
    violet: "text-violet-600 bg-violet-50 border-violet-100",
  };
  return (
    <div className={`p-5 rounded-2xl border ${colors[color] || colors.blue} shadow-sm flex items-center gap-4`}>
       <div className="p-3 bg-white rounded-full">
         <Icon size={20} />
       </div>
       <div>
         <p className="text-2xl font-bold">{value}</p>
         <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
       </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg border shadow-sm">
        <p className="font-bold text-sm">{label}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }} className="text-xs">
            {pld.name}: {pld.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { dateRange } = useDateRange();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'Broker') {
      router.push('/kpi');
    }
  }, [user, router]);

  const leadsQuery = useMemo(() => (firestore ? collection(firestore, 'leads') : null), [firestore]);
  const staffQuery = useMemo(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

  const { data: leadsData } = useCollection<Lead>(leadsQuery);
  const { data: staffData } = useCollection<Staff>(staffQuery);
  
  const allLeads = leadsData || [];
  const allStaff = staffData || [];

  const filteredLeads = useMemo(() => {
      if (!user) return [];
      const visibleLeads = allLeads.filter(lead => {
        if (user.role === 'Admin') return true;
        if (user.role === 'Broker') return lead.ownerId === user.id;
        if (user.role === 'Supervisor') {
          const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
          return lead.ownerId === user.id || teamIds.includes(lead.ownerId);
        }
        return false;
      });

      return visibleLeads.filter(l => {
          if (!l.createdAt) return false;
          const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
          if (!isValid(leadDate)) return false;
          return leadDate >= dateRange.start && leadDate <= dateRange.end;
      });
  }, [allLeads, allStaff, dateRange, user]);


  const { stats, sellerPerformanceData, salesByChannelData, salesTrendData } = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const closedSales = filteredLeads.filter(l => l.stage === 'Ganado').length;
    const conversion = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;
    const totalRevenue = closedSales * REVENUE_PER_VEHICLE;
    const totalCommissions = closedSales * COMMISSION_PER_VEHICLE;

    const sellerStats: { [key: string]: { leads: number; sales: number; commission: number; bonus: number; } } = {};
    allStaff.forEach(staff => {
      if (staff.role === 'Broker' || staff.role === 'Supervisor') {
        sellerStats[staff.name] = { leads: 0, sales: 0, commission: 0, bonus: 0 };
      }
    });

    filteredLeads.forEach(l => {
      if (sellerStats[l.ownerName]) {
        sellerStats[l.ownerName].leads++;
        if (l.stage === 'Ganado') {
          sellerStats[l.ownerName].sales++;
        }
      }
    });
    
    let totalBonuses = 0;
    Object.keys(sellerStats).forEach(name => {
      const sales = sellerStats[name].sales;
      const bonus = calculateBonus(sales);
      sellerStats[name].commission = sales * COMMISSION_PER_VEHICLE;
      sellerStats[name].bonus = bonus;
      totalBonuses += bonus;
    });
    
    const sellerPerformanceData = Object.entries(sellerStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a,b) => b.sales - a.sales);

    const grossMargin = (closedSales * MARGIN_PER_VEHICLE) - totalBonuses;
    const totalToPay = totalCommissions + totalBonuses;

    const channels: { [key: string]: number } = {};
    filteredLeads.forEach(l => {
      if (l.stage === 'Ganado') {
        if (!channels[l.channel]) channels[l.channel] = 0;
        channels[l.channel]++;
      }
    });

    const salesByChannelData = Object.entries(channels).map(([name, value]) => ({ name, value }));
    
    const dailyData: { [key: string]: { leads: number, sales: number } } = {};
    const interval = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    interval.forEach(day => {
        dailyData[format(day, 'MMM d')] = { leads: 0, sales: 0 };
    });
    
    filteredLeads.forEach(lead => {
        const leadDate = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as string);
        if (isValid(leadDate)) {
            const formattedDate = format(leadDate, 'MMM d');
            if (dailyData.hasOwnProperty(formattedDate)) {
                dailyData[formattedDate].leads++;
                if (lead.stage === 'Ganado') {
                    dailyData[formattedDate].sales++;
                }
            }
        }
    });

    const salesTrendData = Object.entries(dailyData).map(([date, data]) => ({ date, ...data }));
    
    const stats = {
      totalLeads, closedSales, conversion, totalRevenue, totalCommissions, grossMargin, totalBonuses, totalToPay
    };
    
    return { stats, sellerPerformanceData, salesByChannelData, salesTrendData };

  }, [filteredLeads, allStaff, dateRange]);


  if (user?.role === 'Broker') {
    return null; // Redirect is handled in useEffect
  }
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Leads" value={stats.totalLeads} color="blue" icon={Users} />
        <StatCard label="Closed Sales" value={stats.closedSales} color="green" icon={DollarSign} />
        <StatCard label="Conversion" value={`${stats.conversion.toFixed(1)}%`} color="indigo" icon={Percent}/>
        <StatCard label="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={Briefcase} color="rose" />
        <StatCard label="Total to Pay" value={`$${stats.totalToPay.toLocaleString()}`} icon={Wallet} color="violet" />
        <StatCard label="Total Commissions" value={`$${stats.totalCommissions.toLocaleString()}`} icon={HandCoins} color="amber" />
        <StatCard label="Total Bonuses" value={`$${stats.totalBonuses.toLocaleString()}`} color="blue" icon={Target} />
        <StatCard label="Gross Margin" value={`$${stats.grossMargin.toLocaleString()}`} icon={PiggyBank} color="emerald" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Sales & Leads Trend</CardTitle>
            <CardDescription>Daily closed sales and new leads over the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Line type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} name="New Leads"/>
                <Line type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={2} name="Sales"/>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
           <CardHeader>
            <CardTitle>Sales by Channel</CardTitle>
            <CardDescription>Distribution of sales across different channels.</CardDescription>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={salesByChannelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                          const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                          return (
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                    >
                       {salesByChannelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
                </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
       </div>
       
       {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
         <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} /> Seller Performance
            </CardTitle>
            <CardDescription>Leads, sales, and commissions per salesperson.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
               <BarChart data={sellerPerformanceData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{fontSize: "12px"}} />
                  <Bar dataKey="sales" fill="#10B981" name="Sales" />
                  <Bar dataKey="commission" fill="#8B5CF6" name="Commission" />
                  <Bar dataKey="leads" fill="#3B82F6" name="Leads"/>
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Salesperson</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Sales</TableHead>
                    <TableHead className="text-center">Conversion</TableHead>
                    <TableHead className="text-right">Commissions</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right font-bold">Total to Pay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerPerformanceData.map((seller) => {
                    const conversionRate = seller.leads > 0 ? (seller.sales / seller.leads) * 100 : 0;
                    const totalToPay = seller.commission + seller.bonus;
                    return (
                      <TableRow key={seller.name}>
                        <TableCell className="font-medium">{seller.name}</TableCell>
                        <TableCell className="text-center">{seller.leads}</TableCell>
                        <TableCell className="text-center font-bold">{seller.sales}</TableCell>
                        <TableCell className="text-center">{conversionRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">${seller.commission.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${seller.bonus.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold">${totalToPay.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
         </Card>
       )}
    </div>
  );
}
