
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff, NoteEntry } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useCollection, useFirestore, useUser } from '@/firebase';
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
import { collection, query, orderBy, updateDoc, doc, arrayUnion, deleteDoc, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { analyzeAndUpdateLead } from "@/ai/flows/analyze-and-update-leads";
import { isWithinInterval } from "date-fns";
import { RenderSubComponent } from "./components/render-sub-component";

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

    // Data is now sourced directly from the real-time hook.
    const { data: leadsDataFromHook, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: staffData, loading: staffLoading } = useCollection<Staff>(staffQuery);

    const allStaff = useMemo(() => staffData || [], [staffData]);

    const { dateRange, setDateRange } = useDateRange();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    const filteredLeads = useMemo(() => {
        const allLeads = leadsDataFromHook || [];
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

    }, [user, leadsDataFromHook, allStaff, dateRange]);
    
    const addNote = useCallback(async (leadId: string, noteContent: string, noteType: NoteEntry['type']) => {
        if (!firestore || !user) return;
        
        const authorName = noteType === 'AI Analysis' ? 'AI Assistant' : (user.name || 'System');

        const newNote: NoteEntry = {
            content: noteContent,
            author: authorName,
            date: Timestamp.now(), // Use server-generated timestamp.
            type: noteType,
        };
        
        const leadRef = doc(firestore, 'leads', leadId);
        
        try {
            await updateDoc(leadRef, {
                notes: arrayUnion(newNote)
            });
        } catch (error) {
            console.error("Failed to add note:", error);
            toast({
                title: "Error Adding Note",
                description: "There was a problem saving your note. Please try again.",
                variant: "destructive",
            });
        }

    }, [firestore, user, toast]);


    const handleUpdateStage = useCallback(async (id: string, stage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', id);
        
        try {
            await updateDoc(leadRef, { stage });
            toast({ title: "Stage Updated", description: `Lead stage changed to ${stage}.` });
            const noteContent = `Stage changed to '${stage}'`;
            await addNote(id, noteContent, 'System');
        } catch (error) {
             console.error("Error updating stage:", error);
             toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
        }
        
    }, [firestore, toast, user, addNote]);

    const handleUpdateLeadStatus = useCallback(async (id: string, leadStatus: NonNullable<Lead['leadStatus']>) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        
        try {
           await updateDoc(leadRef, { leadStatus });
        } catch(error) {
             console.error("Error updating lead status:", error);
             toast({ title: "Error", description: "Could not update lead status.", variant: "destructive"});
        }
        
    }, [firestore, toast]);
    
    const handleDelete = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
            const leadRef = doc(firestore, 'leads', id);
            try {
                await deleteDoc(leadRef);
                toast({ title: "Lead Deleted", description: "The lead has been removed." });
            } catch (error) {
                 toast({ title: "Error Deleting Lead", description: "Could not remove the lead.", variant: "destructive" });
            }
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
        
        const initialNote: NoteEntry = {
            content: noteContent,
            author: owner.name,
            date: new Date(), // Use client date for the initial array
            type: 'Manual'
        };

        const finalLeadData = {
            ...leadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
            notes: [initialNote]
        };

        try {
            toast({ title: "Lead Added", description: "New lead created. Analyzing with AI in background..." });
            const newDocRef = await addDoc(leadsCollection, finalLeadData);
            
            // Now, run the AI analysis in the background
            try {
                const leadDetails = `Name: ${newLeadData.name}, Company: ${newLeadData.company || 'N/A'}, Stage: ${newLeadData.stage}, Notes: ${noteContent}`;
                const analysisResult = await analyzeAndUpdateLead({ leadDetails });
                
                // Add the AI analysis note using the now reliable addNote function
                const analysisNoteContent = `AI Analysis Complete:\n- Qualification: ${analysisResult.qualificationDecision}\n- Recommendation: ${analysisResult.salesRecommendation}`;
                await addNote(newDocRef.id, analysisNoteContent, 'AI Analysis');
                
                // Update the lead status separately
                await updateDoc(newDocRef, { leadStatus: analysisResult.leadStatus });

            } catch (aiError) {
                console.error("Error during background AI analysis:", aiError);
                // Optionally add a note saying the AI analysis failed
                await addNote(newDocRef.id, "Background AI analysis failed to run.", 'System');
            }

        } catch (error) {
             console.error("Error creating lead:", error);
             toast({ title: "Error creating lead", description: "Could not save the new lead.", variant: "destructive" });
        }

    }, [firestore, allStaff, toast, user, addNote]);


    const handleUpdateOwner = useCallback(async (id: string, newOwnerId: string) => {
        if (!firestore || !user) return;

        const allLeads = leadsDataFromHook || [];
        const oldOwnerName = allLeads.find(l => l.id === id)?.ownerName || 'Unknown';
        const newOwner = allStaff.find(s => s.id === newOwnerId);
        
        if (!newOwner) {
            toast({ title: "Error", description: "Selected owner not found.", variant: "destructive" });
            return;
        }
        
        const leadRef = doc(firestore, 'leads', id);

        const updateData = { 
            ownerId: newOwner.id, 
            ownerName: newOwner.name,
        };
        
        try {
            await updateDoc(leadRef, updateData);
            toast({ title: "Owner Updated", description: `Lead reassigned to ${newOwner.name}.` });
            const noteContent = `Owner changed from ${oldOwnerName} to ${newOwner.name}`;
            await addNote(id, noteContent, 'System');
        } catch (error) {
            console.error("Error updating owner:", error);
            toast({ title: "Error", description: "Could not update lead owner.", variant: "destructive"});
        }

    }, [firestore, allStaff, toast, user, leadsDataFromHook, addNote]);

    const handleAddNote = useCallback((leadId: string, noteContent: string, noteType: NoteEntry['type']) => {
        if (!user) return;
        addNote(leadId, noteContent, noteType);
    }, [user, addNote]);

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

    const renderSub = useCallback((props: { row: any }) => {
       return <RenderSubComponent {...props} onAddNote={(leadId, content) => addNote(leadId, content, 'Manual')} />;
    }, [addNote]);


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
                renderSubComponent={renderSub}
            />
        </main>
    );
}
