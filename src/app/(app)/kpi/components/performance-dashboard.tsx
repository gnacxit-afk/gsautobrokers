
'use client';

import { useMemo } from 'react';
import type { Lead, Staff, PerformanceMetric } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export function PerformanceDashboard({ allLeads, allStaff, loading, salesGoal }: { allLeads: Lead[], allStaff: Staff[], loading: boolean, salesGoal: number }) {
  
  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    if (!allStaff.length) return [];
    
    return allStaff.map(staff => {
      const staffLeads = allLeads.filter(lead => lead.ownerId === staff.id);
      
      const metrics: PerformanceMetric = {
        userId: staff.id,
        userName: staff.name,
        leadsRecibidos: staffLeads.length,
        numerosObtenidos: staffLeads.filter(l => l.phone && l.phone.trim() !== '').length,
        citasAgendadas: staffLeads.filter(l => l.stage === 'Citado').length,
        leadsDescartados: staffLeads.filter(l => l.stage === 'Perdido').length,
        ventas: staffLeads.filter(l => l.stage === 'Ganado').length,
        citasConfirmadas: 0, // This metric requires more complex logic
      };
      return metrics;
    }).sort((a,b) => b.ventas - a.ventas);

  }, [allLeads, allStaff]);

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Broker</TableHead>
            <TableHead className="text-center">Leads</TableHead>
            <TableHead className="text-center">Números</TableHead>
            <TableHead className="text-center">Citas</TableHead>
            <TableHead className="text-center">Descartados</TableHead>
            <TableHead className="w-[200px]">Ventas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
            ))
          ) : performanceMetrics.length > 0 ? (
            performanceMetrics.map(metric => (
              <TableRow key={metric.userId}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getAvatarFallback(metric.userName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{metric.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                    <Badge variant="outline">{metric.leadsRecibidos}</Badge>
                </TableCell>
                <TableCell className="text-center">
                    <Badge variant="outline">{metric.numerosObtenidos}</Badge>
                </TableCell>
                 <TableCell className="text-center">
                    <Badge variant="outline">{metric.citasAgendadas}</Badge>
                </TableCell>
                 <TableCell className="text-center">
                    <Badge variant="destructive" className="bg-red-100 text-red-700">{metric.leadsDescartados}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={(metric.ventas / (salesGoal || 1)) * 100} className="flex-1" />
                    <span className="font-bold text-sm">{metric.ventas}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No performance data available for the selected period.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
