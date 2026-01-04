
"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useCollection, useFirestore, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";
import { analyzeAndUpdateLead } from "@/ai/flows/analyze-and-update-leads";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

export default function LeadsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const leadsQuery = useMemo(() => (firestore ? collection(firestore, 'leads') : null), [firestore]);
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
        if (!user) {
            return [];
        }

        let visibleLeads = allLeads;

        if (user.role === 'Supervisor') {
            const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
            const visibleIds = [user.id, ...teamIds];
            visibleLeads = allLeads.filter(l => visibleIds.includes(l.ownerId));
        } else if (user.role === 'Broker') {
            visibleLeads = allLeads.filter(l => l.ownerId === user.id);
        }
        
        return visibleLeads.filter(l => {
            if (!l.createdAt) return false;
            const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
            return leadDate >= dateRange.start && leadDate <= dateRange.end;
        });

    }, [user, allLeads, allStaff, dateRange]);

    const handleUpdateStage = useCallback(async (id: string, stage: Lead['stage']) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { stage });
        toast({ title: "Stage Updated", description: `Lead stage changed to ${stage}.` });
    }, [firestore, toast]);

    const handleUpdateLeadStatus = useCallback(async (id: string, leadStatus: Lead['leadStatus']) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { leadStatus });
        toast({ title: "Lead Status Updated", description: `Lead status changed to ${leadStatus}.` });
    }, [firestore, toast]);
    
    const handleUpdateNotes = useCallback(async (id: string, notes: string) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { notes });
        toast({ title: "Notes Updated", description: "Lead notes have been saved." });
    }, [firestore, toast]);

    const handleDelete = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
            const leadRef = doc(firestore, 'leads', id);
            deleteDocumentNonBlocking(leadRef);
            toast({ title: "Lead Deleted", description: "The lead has been removed." });
        }
    }, [firestore, toast]);

    const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => {
        const owner = allStaff.find(s => s.id === newLeadData.ownerId);
        if (!owner || !firestore) return;

        const leadsCollection = collection(firestore, 'leads');
        const completeLeadData = {
            ...newLeadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        };

        try {
            const docRef = await addDoc(leadsCollection, completeLeadData);
            toast({ title: "Lead Added", description: "New lead created. Analyzing with AI..." });

            // Now, run the AI analysis
            const leadDetails = `Name: ${newLeadData.name}, Company: ${newLeadData.company}, Stage: ${newLeadData.stage}, Notes: ${newLeadData.notes}`;
            const analysisResult = await analyzeAndUpdateLead({ leadDetails });

            // Update the lead with the analysis result
            const newLeadRef = doc(firestore, 'leads', docRef.id);
            updateDocumentNonBlocking(newLeadRef, { 
                leadStatus: analysisResult.leadStatus 
            });
            
            toast({ title: "AI Analysis Complete", description: `Lead status automatically set to ${analysisResult.leadStatus}.` });

        } catch (error) {
            console.error("Error adding or analyzing lead:", error);
            toast({ title: "Error", description: "Could not create or analyze the lead.", variant: "destructive" });
        }
    }, [allStaff, firestore, toast]);


    const handleUpdateOwner = useCallback(async (id: string, newOwner: Staff) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { ownerId: newOwner.id, ownerName: newOwner.name });
        toast({ title: "Owner Updated", description: `Lead reassigned to ${newOwner.name}.` });
    }, [firestore, toast]);


    const columns = useMemo(() => getColumns(handleUpdateStage, handleDelete, handleUpdateOwner, handleUpdateLeadStatus, allStaff), [handleUpdateStage, handleDelete, handleUpdateOwner, handleUpdateLeadStatus, allStaff]);
    
    const table = useReactTable({
      data: filteredLeads,
      columns,
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
                clearAllFilters={clearAllFilters}
                loading={leadsLoading || staffLoading}
            />
        </main>
    );
}
