"use client";

import { useState, useEffect } from "react";
import type { KPI } from "@/lib/types";
import { useAuthContext } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";


const KpiCard = ({ kpi }: { kpi: KPI }) => {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                   <CardTitle className="text-base font-semibold text-slate-700">{kpi.label}</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{kpi.description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold text-primary">{kpi.target}</p>
            </CardContent>
        </Card>
    );
}


export function KpiClient({ initialKpis, loading }: { initialKpis: KPI[], loading: boolean }) {
    const [kpis, setKpis] = useState(initialKpis);

    useEffect(() => {
        setKpis(initialKpis);
    }, [initialKpis]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {kpis.map(kpi => (
                    <KpiCard
                        key={kpi.id}
                        kpi={kpi}
                    />
                ))}
            </div>
        </div>
    );
}
