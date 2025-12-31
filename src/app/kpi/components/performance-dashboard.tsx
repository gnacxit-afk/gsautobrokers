
"use client";

import { useState, useMemo } from 'react';
import type { Lead, Staff, PerformanceMetric } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useDateRange } from '@/hooks/use-date-range';
import { DateRangePicker } from '@/components/layout/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const calculateMetrics = (leads: Lead[]): Omit<PerformanceMetric, 'userId' | 'userName'> => {
    const leadsRecibidos = leads.length;
    const numerosObtenidos = leads.filter(l => l.phone && l.phone.trim() !== '+1').length;
    const citasAgendadas = leads.filter(l => l.status === 'Qualified').length;
    const citasConfirmadas = leads.filter(l => l.status === 'On the way' || l.status === 'On site').length;
    const leadsDescartados = leads.filter(l => l.status === 'Lost').length;
    const ventas = leads.filter(l => l.status === 'Sale' || l.status === 'Closed').length;

    return {
        leadsRecibidos,
        numerosObtenidos,
        citasAgendadas,
        citasConfirmadas,
        leadsDescartados,
        ventas
    };
};


export function PerformanceDashboard({ allLeads, allStaff }: { allLeads: Lead[], allStaff: Staff[] }) {
    const { user } = useAuth();
    const { dateRange } = useDateRange();
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    
    // For non-admins, today's date range is forced.
    const todayRange = {
        start: startOfDay(new Date()),
        end: endOfDay(new Date())
    };
    const activeDateRange = user?.role === 'Admin' ? dateRange : todayRange;

    const performanceData = useMemo(() => {
        const data: PerformanceMetric[] = [];
        
        const staffToDisplay = allStaff.filter(s => s.role === 'Broker' || s.role === 'Supervisor');

        staffToDisplay.forEach(staffMember => {
            const userLeads = allLeads.filter(lead => {
                const leadDate = new Date(lead.createdAt);
                const isOwner = lead.ownerId === staffMember.id;
                const isInDateRange = isWithinInterval(leadDate, activeDateRange);
                return isOwner && isInDateRange;
            });
            
            const metrics = calculateMetrics(userLeads);
            
            data.push({
                userId: staffMember.id,
                userName: staffMember.name,
                ...metrics
            });
        });

        return data;

    }, [allLeads, allStaff, activeDateRange]);

    const filteredData = useMemo(() => {
        if (user?.role === 'Admin') {
            if (selectedUserId === 'all') {
                return performanceData;
            }
            return performanceData.filter(d => d.userId === selectedUserId);
        }
        if (user?.role === 'Supervisor') {
            const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
            const visibleIds = [user.id, ...teamIds];
            return performanceData.filter(d => visibleIds.includes(d.userId));
        }
        if (user?.role === 'Broker') {
            return performanceData.filter(d => d.userId === user.id);
        }
        return [];
    }, [user, performanceData, selectedUserId, allStaff]);


    if (!user) return null;

    if (user.role === 'Broker') {
        const userData = filteredData[0]; // Broker sees only their data
        if (!userData) {
             return <p className="text-muted-foreground">No performance data for today.</p>;
        }
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
               <MetricCard label="Leads Recibidos" value={userData.leadsRecibidos} />
               <MetricCard label="Números Obtenidos" value={userData.numerosObtenidos} />
               <MetricCard label="Citas Agendadas" value={userData.citasAgendadas} />
               <MetricCard label="Citas Confirmadas" value={userData.citasConfirmadas} />
               <MetricCard label="Leads Descartados" value={userData.leadsDescartados} />
               <MetricCard label="Ventas" value={userData.ventas} />
            </div>
        )
    }

    // Admin & Supervisor View
    return (
        <div className="space-y-4">
            {user.role === 'Admin' && (
                <div className="flex flex-col md:flex-row gap-4">
                    <DateRangePicker />
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full md:w-[240px]">
                            <SelectValue placeholder="Filter by user..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Salespeople</SelectItem>
                            {allStaff.filter(s => s.role !== 'Admin').map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="rounded-lg border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Salesperson</TableHead>
                            <TableHead className="text-center">Leads Recibidos</TableHead>
                            <TableHead className="text-center">Números Obtenidos</TableHead>
                            <TableHead className="text-center">Citas Agendadas</TableHead>
                            <TableHead className="text-center">Citas Confirmadas</TableHead>
                            <TableHead className="text-center">Leads Descartados</TableHead>
                            <TableHead className="text-center">Ventas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map(data => (
                            <TableRow key={data.userId}>
                                <TableCell className="font-medium">{data.userName}</TableCell>
                                <TableCell className="text-center">{data.leadsRecibidos}</TableCell>
                                <TableCell className="text-center">{data.numerosObtenidos}</TableCell>
                                <TableCell className="text-center">{data.citasAgendadas}</TableCell>
                                <TableCell className="text-center">{data.citasConfirmadas}</TableCell>
                                <TableCell className="text-center">{data.leadsDescartados}</TableCell>
                                <TableCell className="text-center font-bold text-green-600">{data.ventas}</TableCell>
                            </TableRow>
                        ))}
                         {filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No performance data for the selected criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

const MetricCard = ({ label, value }: { label: string, value: number }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);
