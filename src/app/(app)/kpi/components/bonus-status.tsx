
'use client';

import { useMemo } from 'react';
import type { Staff, Lead, BonusInfo } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';
import { calculateBonus, getNextBonusGoal } from '@/lib/utils';
import { subDays, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

const ProgressBar = ({ sales, nextGoal, color }: { sales: number; nextGoal: number; color: string }) => {
  const progress = nextGoal > 0 ? (sales / nextGoal) * 100 : 100;
  return (
    <div className="w-full">
      <Progress value={progress} className={`[&>div]:bg-gradient-to-r ${color}`} />
    </div>
  );
};

export function BonusStatus({ allLeads, loading }: { allLeads: Lead[]; loading: boolean }) {
  const { user } = useUser();

  const staffBonuses: (BonusInfo & { staffId: string; staffName: string })[] = useMemo(() => {
    if (!allLeads) return [];

    const end = new Date();
    const start = subDays(end, 30);
    
    const leadsInWindow = allLeads.filter(l => {
        const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
        return l.stage === 'Ganado' && isWithinInterval(leadDate, { start, end });
    });

    const salesByOwner = leadsInWindow.reduce((acc, lead) => {
      acc[lead.ownerId] = (acc[lead.ownerId] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    return Object.entries(salesByOwner).map(([staffId, sales]) => {
      const ownerName = allLeads.find(l => l.ownerId === staffId)?.ownerName || 'Unknown';
      const bonus = calculateBonus(sales);
      const { nextGoal, needed } = getNextBonusGoal(sales);
      return { staffId, staffName: ownerName, sales, bonus, nextGoal, needed };
    }).sort((a, b) => b.sales - a.sales);

  }, [allLeads]);
  
  if (loading) {
    return <Card><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
  }

  const userBonus = staffBonuses.find(b => b.staffId === user?.id);

  if (user?.role === 'Broker' && userBonus) {
     return (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <CardHeader className="text-center">
                <Trophy className="mx-auto h-10 w-10 text-yellow-500 mb-2" />
                <CardTitle className="text-xl">Your 30-Day Bonus Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                 <p className="text-5xl font-bold text-indigo-600">${userBonus.bonus.toLocaleString()}</p>
                 <div className="w-full max-w-sm text-center">
                    <ProgressBar sales={userBonus.sales} nextGoal={userBonus.nextGoal} color="from-yellow-400 to-orange-500" />
                    <div className="flex justify-between text-xs font-medium text-slate-500 mt-1.5">
                        <span>{userBonus.sales} Sales</span>
                        <span>Goal: {userBonus.nextGoal}</span>
                    </div>
                 </div>
                 <p className="text-sm text-slate-600">
                    You need <span className="font-bold text-indigo-700">{userBonus.needed} more sales</span> to reach the next bonus of <span className="font-bold text-indigo-700">${calculateBonus(userBonus.nextGoal).toLocaleString()}</span>.
                 </p>
            </CardContent>
        </Card>
     )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Broker</TableHead>
            <TableHead className="text-center">Sales (30d)</TableHead>
            <TableHead className="text-center">Current Bonus</TableHead>
            <TableHead>Progress to Next Goal</TableHead>
            <TableHead className="text-right">Needed for Next</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staffBonuses.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center h-24">No sales recorded in the last 30 days.</TableCell></TableRow>
          )}
          {staffBonuses.map(b => (
            <TableRow key={b.staffId}>
              <TableCell className="font-medium">{b.staffName}</TableCell>
              <TableCell className="text-center font-bold text-lg">{b.sales}</TableCell>
              <TableCell className="text-center font-bold text-lg text-green-600">${b.bonus.toLocaleString()}</TableCell>
              <TableCell>
                <ProgressBar sales={b.sales} nextGoal={b.nextGoal} color="from-blue-500 to-cyan-400" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{b.sales} / {b.nextGoal}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{b.needed}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
