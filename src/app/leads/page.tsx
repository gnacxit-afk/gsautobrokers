
"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useCollection, useFirestore, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
} from '@tanstack/react-table';
import { collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";
import { analyzeAndUpdateLead } from "@/ai/flows/analyze-and-update-leads";
import { isWithinInterval } from "date-fns";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];
const leadStatuses: NonNullable<Lead['leadStatus']>[] = ["Hot Lead", "Warm Lead", "In Nurturing", "Cold Lead"];


// This function is now outside the component, so it's not recreated on every render.
const globalFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
    const search = filterValue.toLowerCase();

    const value = row.original;
    const nameMatch = value.name?.toLowerCase().includes(search);
    const emailMatch = value.email?.toLowerCase().includes(search);
    const phoneMatch = value.phone?.toLowerCase().includes(search);
    const ownerNameMatch = value.ownerName?.toLowerCase().includes(search);
    
    return nameMatch || emailMatch || phoneMatch || ownerNameMatch;
};


export default function LeadsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const leadsQuery = useMemo(() => (firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const staffQuery = useMemo(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

    const { data: leadsData, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: staffData, loading: staffLoading } = useCollection<Staff>(staffQuery);
    
    const allLeads = useMemo(() => leadsData || [], [leadsData]);
    const allStaff = useMemo(() => staffData || [], [staffData]);

    const { dateRange, setDateRange } = useDateRange();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    const filteredLeads = useMemo(() => {
        if (!user) return [];

        let visibleLeads = allLeads;

        if (user.role === 'Supervisor') {
            const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
            const visibleIds = [user.id, ...teamIds];
            visibleLeads = allLeads.filter(l => visibleIds.includes(l.ownerId));
        } else if (user.role === 'Broker') {
            visibleLeads = allLeads.filter(l => l.ownerId === user.id);
        }
        
        // Date filtering
        return visibleLeads.filter(l => {
            if (!l.createdAt) return false;
            const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
            return isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end });
        });

    }, [user, allLeads, allStaff, dateRange]);

    const handleUpdateStage = useCallback((id: string, stage: Lead['stage']) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { stage });
        toast({ title: "Stage Updated", description: `Lead stage changed to ${stage}.` });
    }, [firestore, toast]);

    const handleUpdateLeadStatus = useCallback((id: string, leadStatus: NonNullable<Lead['leadStatus']>) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { leadStatus });
    }, [firestore]);
    
    const handleUpdateNotes = useCallback((id: string, notes: string) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { notes });
        toast({ title: "Notes Updated", description: "Lead notes have been saved." });
    }, [firestore, toast]);

    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
            const leadRef = doc(firestore, 'leads', id);
            deleteDocumentNonBlocking(leadRef);
            toast({ title: "Lead Deleted", description: "The lead has been removed." });
        }
    }, [firestore, toast]);

    const handleAddLead = useCallback((newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => {
        if (!firestore || !user) return;
        const owner = allStaff.find(s => s.id === newLeadData.ownerId);
        if (!owner) {
             toast({ title: "Error", description: "Could not find lead owner.", variant: "destructive" });
             return;
        };

        const leadsCollection = collection(firestore, 'leads');
        
        addDocumentNonBlocking(leadsCollection, {
            ...newLeadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        }).then(docRef => {
             if (!docRef) return;
             toast({ title: "Lead Added", description: "New lead created. Analyzing with AI in background..." });
             
             (async () => {
                try {
                    const newLeadId = docRef.id;
                    const leadDetails = `Name: ${newLeadData.name}, Company: ${newLeadData.company}, Stage: ${newLeadData.stage}, Notes: ${newLeadData.notes}`;
                    const analysisResult = await analyzeAndUpdateLead({ leadDetails });

                    const newLeadRef = doc(firestore, 'leads', newLeadId);
                    updateDocumentNonBlocking(newLeadRef, { 
                        leadStatus: analysisResult.leadStatus 
                    });
                    
                    toast({ title: "AI Analysis Complete", description: `Lead status for ${newLeadData.name} set to ${analysisResult.leadStatus}.` });
                } catch (aiError) {
                    console.error("Error during background AI analysis:", aiError);
                    // Do not show a failure toast for background task, just log it.
                }
            })();
        }).catch(error => {
             console.error("Error adding lead:", error);
             toast({ title: "Error", description: "Could not create the lead.", variant: "destructive" });
        });
    }, [firestore, allStaff, toast, user]);


    const handleUpdateOwner = useCallback((id: string, newOwnerId: string) => {
        if (!firestore) return;
        const newOwner = allStaff.find(s => s.id === newOwnerId);
        if (!newOwner) {
            toast({ title: "Error", description: "Selected owner not found.", variant: "destructive" });
            return;
        }
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { ownerId: newOwner.id, ownerName: newOwner.name });
        toast({ title: "Owner Updated", description: `Lead reassigned to ${newOwner.name}.` });
    }, [firestore, allStaff, toast]);

    const columns = useMemo(
        () => getColumns(handleUpdateStage, handleDelete, handleUpdateLeadStatus, handleUpdateOwner, allStaff), 
        [handleUpdateStage, handleDelete, handleUpdateLeadStatus, handleUpdateOwner, allStaff]
    );
    
    const table = useReactTable({
      data: filteredLeads,
      columns,
      globalFilterFn: globalFilterFn,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
      onGlobalFilterChange: setGlobalFilter,
      getFilteredRowModel: getFilteredRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      onExpandedChange: setExpanded,
      onColumnFiltersChange: setColumnFilters,
      state: {
        sorting,
        globalFilter,
        expanded,
        columnFilters
      },
    });

    const clearAllFilters = useCallback(() => {
        table.setGlobalFilter('');
        table.setColumnFilters([]);
        setDateRange({
          start: new Date(new Date().getFullYear(), 0, 1),
          end: new Date(new Date().getFullYear(), 11, 31),
        });
    }, [table, setDateRange]);

    return (
        <main className="flex flex-1 flex-col gap-4">
            <DataTable 
                table={table}
                columns={columns}
                onUpdateNotes={handleUpdateNotes}
                onAddLead={handleAddLead}
                staff={allStaff}
                stages={leadStages}
                channels={channels}
                leadStatuses={leadStatuses}
                clearAllFilters={clearAllFilters}
                loading={leadsLoading || staffLoading}
            />
        </main>
    );
}
