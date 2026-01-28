
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, writeBatch, getDocs, serverTimestamp } from 'firebase/firestore';
import type { Lead, Staff, Appointment } from '@/lib/types';
import { useCollection } from '@/firebase/firestore/use-collection';
import { KanbanBoard } from '../components/kanban-board';
import { AttackList } from '../components/attack-list';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { addNoteEntry, createNotification } from '@/lib/utils';
import { COMMISSION_PER_VEHICLE } from '@/lib/mock-data';

export default function LeadsPipelinePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Data fetching
    const staffQuery = useMemo(() => (firestore && user ? collection(firestore, 'staff') : null), [firestore, user]);
    const { data: staffData, loading: staffLoading } = useCollection<Staff>(staffQuery);

    const leadsQuery = useMemo(() => {
        if (!firestore || !user || !staffData?.length) return null;
        if (user.role === 'Broker') {
            return query(collection(firestore, 'leads'), where('ownerId', '==', user.id));
        }
        if (user.role === 'Supervisor') {
            const teamIds = staffData.filter(s => s.supervisorId === user.id).map(s => s.id);
            return query(collection(firestore, 'leads'), where('ownerId', 'in', [...teamIds, user.id]));
        }
        return query(collection(firestore, 'leads'));
    }, [firestore, user, staffData]);

    const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

    const appointmentsQuery = useMemo(() => {
        if (!firestore || !user) return null;
        // This is still not quite right. A separate query for appointments is better.
        return query(collection(firestore, 'appointments'));
    }, [firestore, user]);

    const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);
    
    const handleStageChange = useCallback(async (leadId: string, newStage: Lead['stage']) => {
        if (!firestore || !user || !staffData || !leads) return;
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.stage === newStage) return;

        // Special handling for "Ganado"
        if (newStage === 'Ganado' && !lead.interestedVehicleId) {
            toast({
                title: "Acción Requerida",
                description: "Para marcar un lead como 'Ganado', primero debe vincular un vehículo de interés desde la página de detalles del lead.",
                variant: "destructive",
                duration: 5000,
            });
            return; // Abort stage change
        }

        const batch = writeBatch(firestore);
        const leadRef = doc(firestore, 'leads', leadId);

        try {
            let brokerCommission = lead.brokerCommission || null;
            if (newStage === 'Ganado') {
                const owner = staffData.find(s => s.id === lead.ownerId);
                brokerCommission = owner?.commission ?? COMMISSION_PER_VEHICLE;

                if (lead.interestedVehicleId) {
                    const vehicleRef = doc(firestore, 'inventory', lead.interestedVehicleId);
                    batch.update(vehicleRef, { 
                        status: 'Sold',
                        soldBy: lead.ownerId,
                        soldAt: serverTimestamp()
                    });
                }
            }

            batch.update(leadRef, { stage: newStage, lastActivity: serverTimestamp(), brokerCommission });

            // Update associated appointments
            const appsQuery = query(collection(firestore, 'appointments'), where("leadId", "==", leadId));
            const appsSnapshot = await getDocs(appsQuery);
            appsSnapshot.forEach(appDoc => {
                batch.update(appDoc.ref, { stage: newStage });
            });

            await batch.commit();

            await addNoteEntry(firestore, user, leadId, `Stage changed from '${lead.stage}' to '${newStage}' by drag & drop.`, 'Stage Change');
            
            if (lead.ownerId !== user.id) {
                await createNotification(firestore, lead.ownerId, lead, `Stage for lead ${lead.name} was changed to ${newStage} by ${user.name}.`, user.name);
            }

            toast({ title: "Stage Updated", description: `Lead "${lead.name}" moved to ${newStage}.` });
        } catch (error) {
            console.error("Error updating stage from Kanban:", error);
            toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive" });
        }

    }, [firestore, user, staffData, leads, toast]);

    const loading = leadsLoading || appointmentsLoading || staffLoading;

    return (
        <main className="flex flex-1 flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Leads Pipeline</h1>
                    <p className="text-muted-foreground">Manage your sales funnel with a visual drag-and-drop board.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/leads"><List className="mr-2 h-4 w-4" /> Switch to Table View</Link>
                </Button>
            </div>
            
            <AttackList leads={leads || []} appointments={appointments || []} loading={loading} />

            <KanbanBoard leads={leads || []} onStageChange={handleStageChange} loading={loading} />
        </main>
    );
}
