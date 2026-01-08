
"use client";

import { useMemo } from 'react';
import type { Lead, BonusInfo } from '@/lib/types';
import { useAuthContext } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isWithinInterval, subDays } from 'date-fns';
import { calculateBonus, getNextBonusGoal } from '@/lib/utils';
import { Award, Target, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => {
  const colors: { [key: string]: string } = {
    green: "text-green-600 bg-green-50 border-green-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
  };
  return (
    <div className={`p-6 rounded-2xl border ${colors[color] || colors.blue} shadow-sm flex items-center gap-4`}>
        <div className="p-3 bg-white rounded-full">
         {icon}
        </div>
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
        </div>
    </div>
  );
};


export function BonusStatus({ allLeads, loading }: { allLeads: Lead[], loading: boolean }) {
    const { user } = useAuthContext();

    const bonusInfo: BonusInfo | null = useMemo(() => {
        if (!user) return null;

        const thirtyDaysAgo = subDays(new Date(), 30);
        const now = new Date();

        const userLeads = allLeads.filter(lead => {
            const leadDate = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as string);
            const isOwner = lead.ownerId === user.id;
            const isInDateRange = isWithinInterval(leadDate, { start: thirtyDaysAgo, end: now });
            // For bonus, only 'Ganado' should count
            return isOwner && lead.stage === 'Ganado' && isInDateRange;
        });
        
        const sales = userLeads.length;
        const bonus = calculateBonus(sales);
        const { nextGoal, needed } = getNextBonusGoal(sales);

        return { sales, bonus, nextGoal, needed };
    }, [allLeads, user]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!user || !bonusInfo) return null;

    const getBonusMessage = () => {
      if (bonusInfo.needed > 0) {
        return `You are ${bonusInfo.needed} sale${bonusInfo.needed > 1 ? 's' : ''} away from the next bonus of $${calculateBonus(bonusInfo.nextGoal)}!`;
      }
      return "You've reached the highest bonus tier! Great job!";
    }

    return (
        <Card>
          <CardHeader>
            <CardTitle>Your Monthly Bonus Progress</CardTitle>
            <CardDescription>
              {getBonusMessage()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatCard 
                label="Sales in last 30 days"
                value={bonusInfo.sales}
                icon={<Trophy size={24} className="text-green-500"/>}
                color="green"
            />
            <StatCard 
                label="Current Bonus"
                value={`$${bonusInfo.bonus}`}
                icon={<Award size={24} className="text-amber-500"/>}
                color="amber"
            />
            <StatCard 
                label="Next Bonus Goal"
                value={`${bonusInfo.nextGoal} Sales`}
                icon={<Target size={24} className="text-blue-500"/>}
                color="blue"
            />
          </CardContent>
        </Card>
    );
}

    