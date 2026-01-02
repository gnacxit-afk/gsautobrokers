"use client";

import { useState, useEffect } from "react";
import type { KPI } from "@/lib/types";
import { useAuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Edit, Save, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";


const KpiCard = ({ kpi, isEditing, onValueChange }: { kpi: KPI, isEditing: boolean, onValueChange: (value: string) => void }) => {
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
                {isEditing ? (
                    <Input
                        type="text"
                        value={kpi.target}
                        onChange={(e) => onValueChange(e.target.value)}
                        className="text-2xl font-bold h-10"
                    />
                ) : (
                    <p className="text-2xl font-bold text-primary">{kpi.target}</p>
                )}
            </CardContent>
        </Card>
    );
}


export function KpiClient({ initialKpis, loading }: { initialKpis: KPI[], loading: boolean }) {
    const { user } = useAuthContext();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [kpis, setKpis] = useState(initialKpis);
    const [isEditing, setIsEditing] = useState(false);
    const [draftKpis, setDraftKpis] = useState([...initialKpis]);

    useEffect(() => {
        setKpis(initialKpis);
        setDraftKpis([...initialKpis]);
    }, [initialKpis]);


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

    const handleSaveChanges = async () => {
        if (!firestore) return;
        try {
            const updatePromises = draftKpis.map(kpi => {
                const kpiRef = doc(firestore, 'kpis', kpi.id);
                return updateDoc(kpiRef, { target: kpi.target });
            });

            await Promise.all(updatePromises);
            
            setKpis(draftKpis);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
