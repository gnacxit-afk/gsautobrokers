
"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff, NoteEntry } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useCollection, useFirestore, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
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
import { collection, serverTimestamp, query, orderBy, updateDoc, doc, arrayUnion, getDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { analyzeAndUpdateLead } from "@/ai/flows/analyze-and-update-leads";
import { isWithinInterval } from "date-fns";
import { RenderSubComponent } from "./components/render-sub-component";
import { AddNoteDialog } from "./components/add-note-dialog";

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
    
    const addNote = useCallback(async (leadId: string, noteContent: string, noteType: NoteEntry['type'], authorName?: string) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', leadId);

        try {
            await updateDoc(leadRef, {
                notes: arrayUnion({
                    content: noteContent,
                    author: authorName || user.name,
                    date: serverTimestamp(),
                    type: noteType,
                })
            });
        } catch (error) {
            console.error("Failed to add note:", error);
            // This is the user-facing error.
             toast({
                title: "Error adding note",
                description: "There was a problem saving your note. Please try again.",
                variant: "destructive",
            });
        }
    }, [firestore, user, toast]);


    const handleUpdateStage = useCallback((id: string, stage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', id);
        
        updateDocumentNonBlocking(leadRef, { stage });

        const noteContent = `Stage changed to '${stage}'`;
        addNote(id, noteContent, 'System');
        
        toast({ title: "Stage Updated", description: `Lead stage changed to ${stage}.` });
    }, [firestore, toast, user, addNote]);

    const handleUpdateLeadStatus = useCallback((id: string, leadStatus: NonNullable<Lead['leadStatus']>, analysis?: { decision: string; recommendation: string }) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        
        updateDocumentNonBlocking(leadRef, { leadStatus });

        if (analysis) {
            const noteContent = `AI Analysis Complete:\n- Qualification: ${analysis.decision}\n- Recommendation: ${analysis.recommendation}`;
            addNote(id, noteContent, 'AI Analysis', 'AI Assistant');
        }
    }, [firestore, addNote]);
    
    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
            const leadRef = doc(firestore, 'leads', id);
            deleteDocumentNonBlocking(leadRef);
            toast({ title: "Lead Deleted", description: "The lead has been removed." });
        }
    }, [firestore, toast]);

    const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName' | 'notes'> & { noteContent: string }) => {
        if (!firestore || !user) return;
        const owner = allStaff.find(s => s.id === newLeadData.ownerId);
        if (!owner) {
             toast({ title: "Error", description: "Could not find lead owner.", variant: "destructive" });
             return;
        };

        const { noteContent, ...leadData } = newLeadData;

        const leadsCollection = collection(firestore, 'leads');
        const newLeadRef = doc(leadsCollection);

        const initialNote: NoteEntry = {
            content: noteContent,
            author: owner.name,
            date: new Date(),
            type: 'Manual'
        };

        const finalLeadData = {
            ...leadData,
            id: newLeadRef.id,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
            notes: [initialNote]
        };

        setDocumentNonBlocking(newLeadRef, finalLeadData, {});
        
        toast({ title: "Lead Added", description: "New lead created. Analyzing with AI in background..." });
         
        try {
            const leadDetails = `Name: ${newLeadData.name}, Company: ${newLeadData.company || 'N/A'}, Stage: ${newLeadData.stage}, Notes: ${noteContent}`;
            const analysisResult = await analyzeAndUpdateLead({ leadDetails });
            
            await addNote(newLeadRef.id, `AI Analysis Complete:\n- Qualification: ${analysisResult.qualificationDecision}\n- Recommendation: ${analysisResult.salesRecommendation}`, 'AI Analysis', 'AI Assistant');
            
            updateDocumentNonBlocking(newLeadRef, { leadStatus: analysisResult.leadStatus });
            
            toast({ title: "AI Analysis Complete", description: `Lead status for ${newLeadData.name} set to ${analysisResult.leadStatus}.` });
        } catch (aiError) {
            console.error("Error during background AI analysis:", aiError);
        }

    }, [firestore, allStaff, toast, user, addNote]);


    const handleUpdateOwner = useCallback((id: string, newOwnerId: string) => {
        if (!firestore || !user) return;
        const oldOwnerName = allLeads.find(l => l.id === id)?.ownerName || 'Unknown';
        const newOwner = allStaff.find(s => s.id === newOwnerId);
        if (!newOwner) {
            toast({ title: "Error", description: "Selected owner not found.", variant: "destructive" });
            return;
        }
        
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { 
            ownerId: newOwner.id, 
            ownerName: newOwner.name,
        });

        const noteContent = `Owner changed from ${oldOwnerName} to ${newOwner.name}`;
        addNote(id, noteContent, 'System');

        toast({ title: "Owner Updated", description: `Lead reassigned to ${newOwner.name}.` });
    }, [firestore, allStaff, toast, user, allLeads, addNote]);

    const handleAddNote = useCallback((leadId: string, noteContent: string) => {
        if (!user) return;
        addNote(leadId, noteContent, 'Manual', user.name);
        toast({ title: "Note Added", description: "Your note has been saved." });
    }, [user, addNote, toast]);

    const columns = useMemo(
        () => getColumns(handleUpdateStage, handleDelete, handleUpdateLeadStatus, handleUpdateOwner, handleAddNote, allStaff), 
        [handleUpdateStage, handleDelete, handleUpdateLeadStatus, handleUpdateOwner, handleAddNote, allStaff]
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
      getRowCanExpand: () => true,
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
                onAddLead={handleAddLead}
                staff={allStaff}
                stages={leadStages}
                channels={channels}
                leadStatuses={leadStatuses}
                clearAllFilters={clearAllFilters}
                loading={leadsLoading || staffLoading}
                renderSubComponent={(props) => <RenderSubComponent {...props} onAddNote={handleAddNote} />}
            />
        </main>
    );
}
