"use client";

import { useState } from "react";
import type { KPI } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateKpi, getKpis } from "@/lib/kpi-data";
import { Edit, Save, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const KpiCard = ({ kpi, isEditing, onValueChange }: { kpi: KPI, isEditing: boolean, onValueChange: (value: string) => void }) => {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-center">
                   <CardTitle className="text-lg font-semibold text-slate-800">{kpi.label}</CardTitle>
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
                {isEditing ? (
                    <Input
                        type="text"
                        value={kpi.target}
                        onChange={(e) => onValueChange(e.target.value)}
                        className="text-3xl font-bold h-12"
                    />
                ) : (
                    <p className="text-3xl font-bold text-primary">{kpi.target}</p>
                )}
            </CardContent>
        </Card>
    );
}


export function KpiClient({ initialKpis }: { initialKpis: KPI[] }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [kpis, setKpis] = useState(initialKpis);
    const [isEditing, setIsEditing] = useState(false);
    const [draftKpis, setDraftKpis] = useState([...initialKpis]);

    const handleEditToggle = () => {
        if (isEditing) {
            // If canceling, revert draft to current KPIs
            setDraftKpis([...kpis]);
        }
        setIsEditing(!isEditing);
    };

    const handleDraftChange = (id: string, value: string) => {
        setDraftKpis(draftKpis.map(kpi => kpi.id === id ? { ...kpi, target: value } : kpi));
    };

    const handleSaveChanges = () => {
        try {
            draftKpis.forEach(kpi => {
                updateKpi(kpi.id, kpi.target);
            });
            // After updating mock data, refresh state from the source of truth
            const updatedKpis = getKpis();
            setKpis(updatedKpis);
            setDraftKpis([...updatedKpis]);
            setIsEditing(false);
            toast({
                title: "KPIs Updated",
                description: "The performance targets have been saved.",
            });
        } catch (error) {
             toast({
                title: "Update Failed",
                description: "Could not save KPI changes.",
                variant: "destructive",
            });
        }
    };

    return (
        <div>
            {user?.role === 'Admin' && (
                <div className="flex justify-end gap-2 mb-6">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={handleEditToggle}><X className="mr-2 h-4 w-4"/> Cancel</Button>
                            <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4"/> Save Changes</Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={handleEditToggle}><Edit className="mr-2 h-4 w-4"/> Edit Targets</Button>
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(isEditing ? draftKpis : kpis).map(kpi => (
                    <KpiCard
                        key={kpi.id}
                        kpi={kpi}
                        isEditing={isEditing}
                        onValueChange={(value) => handleDraftChange(kpi.id, value)}
                    />
                ))}
            </div>
        </div>
    );
}
