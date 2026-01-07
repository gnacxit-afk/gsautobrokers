
"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff, NoteEntry } from "@/lib/types";
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
import { collection, serverTimestamp, query, orderBy, arrayUnion, writeBatch } from 'firebase/firestore';
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
    
    const handleAddNote = useCallback((leadId: string, noteContent: string) => {
        if (!firestore || !user) return;
        
        const newNote: NoteEntry = {
            content: noteContent,
            author: user.name,
            date: serverTimestamp(),
            type: 'Manual',
        };

        const leadRef = doc(firestore, 'leads', leadId);
        updateDocumentNonBlocking(leadRef, {
            notes: arrayUnion(newNote)
        });
        toast({ title: "Note Added", description: "Your note has been saved." });
    }, [firestore, user, toast]);

    const handleUpdateStage = useCallback((id: string, stage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', id);
        
        const systemNote: NoteEntry = {
            content: `Stage changed to '${stage}'`,
            author: user.name,
            date: serverTimestamp(),
            type: 'System'
        };

        updateDocumentNonBlocking(leadRef, { 
            stage,
            notes: arrayUnion(systemNote)
        });
        toast({ title: "Stage Updated", description: `Lead stage changed to ${stage}.` });
    }, [firestore, toast, user]);

    const handleUpdateLeadStatus = useCallback((id: string, leadStatus: NonNullable<Lead['leadStatus']>, analysis?: { decision: string; recommendation: string }) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        
        const updates: any = { leadStatus };

        if (analysis) {
            const aiNote: NoteEntry = {
                content: `Decision: ${analysis.decision}\nRecommendation: ${analysis.recommendation}`,
                author: 'AI Assistant',
                date: serverTimestamp(),
                type: 'AI Analysis'
            };
            updates.notes = arrayUnion(aiNote);
        }

        updateDocumentNonBlocking(leadRef, updates);
    }, [firestore]);
    
    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
            const leadRef = doc(firestore, 'leads', id);
            deleteDocumentNonBlocking(leadRef);
            toast({ title: "Lead Deleted", description: "The lead has been removed." });
        }
    }, [firestore, toast]);

    const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => {
        if (!firestore || !user) return;
        const owner = allStaff.find(s => s.id === newLeadData.ownerId);
        if (!owner) {
             toast({ title: "Error", description: "Could not find lead owner.", variant: "destructive" });
             return;
        };

        const leadsCollection = collection(firestore, 'leads');
        
        // Use a write batch to ensure atomicity
        const batch = writeBatch(firestore);
        const newLeadRef = doc(collection(firestore, "leads")); // Create a new doc ref with an auto-generated ID

        const initialNote: NoteEntry = {
            content: newLeadData.notes?.[0]?.content || "Lead created.",
            author: user.name,
            date: serverTimestamp(),
            type: 'Manual',
        };

        batch.set(newLeadRef, {
            ...newLeadData,
            notes: [initialNote], // Start with the initial note
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        });

        await batch.commit();
        
        toast({ title: "Lead Added", description: "New lead created. Analyzing with AI in background..." });
             
        // Background AI analysis
        try {
            const leadDetails = `Name: ${newLeadData.name}, Company: ${newLeadData.company}, Stage: ${newLeadData.stage}, Notes: ${initialNote.content}`;
            const analysisResult = await analyzeAndUpdateLead({ leadDetails });

            const aiNote: NoteEntry = {
                content: `Decision: ${analysisResult.qualificationDecision}\nRecommendation: ${analysisResult.salesRecommendation}`,
                author: 'AI Assistant',
                date: serverTimestamp(),
                type: 'AI Analysis'
            };

            updateDocumentNonBlocking(newLeadRef, { 
                leadStatus: analysisResult.leadStatus,
                notes: arrayUnion(aiNote)
            });
            
            toast({ title: "AI Analysis Complete", description: `Lead status for ${newLeadData.name} set to ${analysisResult.leadStatus}.` });
        } catch (aiError) {
            console.error("Error during background AI analysis:", aiError);
            // Do not show a failure toast for background task, just log it.
        }

    }, [firestore, allStaff, toast, user]);


    const handleUpdateOwner = useCallback((id: string, newOwnerId: string) => {
        if (!firestore || !user) return;
        const newOwner = allStaff.find(s => s.id === newOwnerId);
        if (!newOwner) {
            toast({ title: "Error", description: "Selected owner not found.", variant: "destructive" });
            return;
        }
        
        const systemNote: NoteEntry = {
            content: `Owner changed to '${newOwner.name}'`,
            author: user.name,
            date: serverTimestamp(),
            type: 'System'
        };

        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { 
            ownerId: newOwner.id, 
            ownerName: newOwner.name,
            notes: arrayUnion(systemNote)
        });
        toast({ title: "Owner Updated", description: `Lead reassigned to ${newOwner.name}.` });
    }, [firestore, allStaff, toast, user]);

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
                onAddNote={handleAddNote}
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

    