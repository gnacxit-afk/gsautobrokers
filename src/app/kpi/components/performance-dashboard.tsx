
"use client";

import { useState, useMemo } from 'react';
import type { Lead, Staff, PerformanceMetric } from '@/lib/types';
import { useAuthContext } from '@/lib/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateBonus } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


const calculateMetrics = (leads: Lead[]): Omit<PerformanceMetric, 'userId' | 'userName'> => {
    const leadsRecibidos = leads.length;
    const numerosObtenidos = leads.filter(l => l.phone && l.phone.trim() !== '').length;
    const citasAgendadas = leads.filter(l => l.stage === 'Citado').length;
    const citasConfirmadas = leads.filter(l => l.stage === 'En Seguimiento').length;
    const leadsDescartados = leads.filter(l => l.stage === 'Perdido').length;
    const ventas = leads.filter(l => l.stage === 'Ganado').length;

    return {
        leadsRecibidos,
        numerosObtenidos,
        citasAgendadas,
        citasConfirmadas,
        leadsDescartados,
        ventas
    };
};


export function PerformanceDashboard({ allLeads, allStaff, loading }: { allLeads: Lead[], allStaff: Staff[], loading: boolean }) {
    const { user } = useAuthContext();
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    
    const performanceData = useMemo(() => {
        // Correctly include all staff who can be lead owners.
        const staffToDisplay = allStaff.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin');

        const data: PerformanceMetric[] = staffToDisplay.map(staffMember => {
            const userLeads = allLeads.filter(lead => lead.ownerId === staffMember.id);
            const metrics = calculateMetrics(userLeads);
            
            return {
                userId: staffMember.id,
                userName: staffMember.name,
                ...metrics,
            };
        });

        return data.sort((a, b) => b.ventas - a.ventas);

    }, [allLeads, allStaff]);

    const filteredData = useMemo(() => {
        switch (user?.role) {
            case 'Admin':
                if (selectedUserId === 'all') {
                    // Admin with "All" selected sees everyone's performance data.
                    return performanceData;
                } else {
                    // Admin filtering for a specific user.
                    return performanceData.filter(d => d.userId === selectedUserId);
                }
            case 'Supervisor':
                // Supervisor sees their own data plus their team's data.
                const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
                const visibleIds = [user.id, ...teamIds];
                return performanceData.filter(d => visibleIds.includes(d.userId));
            case 'Broker':
                // Broker sees only their own data.
                return performanceData.filter(d => d.userId === user.id);
            default:
                // If no role or an unknown role, return an empty array.
                return [];
        }
    }, [user, performanceData, selectedUserId, allStaff]);


    if (!user) return null;

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <Skeleton className="h-10 w-full md:w-[240px]" />
                </div>
                <div className="rounded-lg border bg-white">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                {[...Array(7)].map((_, i) => (
                                    <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    {[...Array(7)].map((_, j) => (
                                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    if (user.role === 'Broker') {
        const userData = filteredData[0];
        const safeUserData = userData || { leadsRecibidos: 0, numerosObtenidos: 0, citasAgendadas: 0, citasConfirmadas: 0, leadsDescartados: 0, ventas: 0 };
        
        return (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
               <MetricCard label="Leads Recibidos" value={safeUserData.leadsRecibidos} />
               <MetricCard label="Números Obtenidos" value={safeUserData.numerosObtenidos} />
               <MetricCard label="Citas Agendadas" value={safeUserData.citasAgendadas} />
               <MetricCard label="Citas Confirmadas" value={safeUserData.citasConfirmadas} />
               <MetricCard label="Leads Descartados" value={safeUserData.leadsDescartados} />
               <MetricCard label="Ventas" value={safeUserData.ventas} />
            </div>
        )
    }

    // Admin & Supervisor View
    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {user.role === 'Admin' && (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full md:w-[240px]">
                            <SelectValue placeholder="Filter by user..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Salespeople</SelectItem>
                            {allStaff.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin').map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <div className="rounded-lg border bg-white overflow-x-auto">
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
                        {filteredData.length > 0 ? (
                            filteredData.map(data => (
                                <TableRow key={data.userId}>
                                    <TableCell className="font-medium">{data.userName}</TableCell>
                                    <TableCell className="text-center">{data.leadsRecibidos}</TableCell>
                                    <TableCell className="text-center">{data.numerosObtenidos}</TableCell>
                                    <TableCell className="text-center">{data.citasAgendadas}</TableCell>
                                    <TableCell className="text-center">{data.citasConfirmadas}</TableCell>
                                    <TableCell className="text-center">{data.leadsDescartados}</TableCell>
                                    <TableCell className="text-center font-bold text-green-600">{data.ventas}</TableCell>
                                </TableRow>
                            ))
                         ) : (
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

const MetricCard = ({ label, value }: { label: string, value: number | string }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">{value}</p>
        </CardContent>
    </Card>
);

    

    