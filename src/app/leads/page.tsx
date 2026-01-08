
"use client";

import { useState, useMemo, useCallback } from "react";
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
import { isWithinInterval, isValid } from "date-fns";
import { RenderSubComponent } from "./components/render-sub-component";
import { DateRangeProvider } from "@/providers/date-range-provider";
import { AddNoteDialog } from "./components/add-note-dialog";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

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


function LeadsPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const leadsQuery = useMemo(() => (firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const staffQuery = useMemo(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

    const { data: leadsData, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: staffData, loading: staffLoading } = useCollection<Staff>(staffQuery);

    const allStaff = useMemo(() => staffData || [], [staffData]);

    const { dateRange, setDateRange } = useDateRange();
    
    // State for the AddNoteDialog
    const [noteLeadId, setNoteLeadId] = useState<string | null>(null);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    const leads = useMemo(() => {
        const allLeads = leadsData || [];
        if (!user) {
            return [];
        };

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
            // Safely convert Firestore Timestamp to JS Date before comparison
            const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
            if (!isValid(leadDate)) return false; // Invalid date check
            return isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end });
        });

    }, [user, leadsData, allStaff, dateRange]);
    
    const addNote = useCallback((leadId: string, noteContent: string, noteType: NoteEntry['type']) => {
        if (!firestore || !user) return;
        
        const authorName = noteType === 'AI Analysis' ? 'AI Assistant' : (user.name || 'System');

        const newNote: NoteEntry = {
            content: noteContent,
            author: authorName,
            date: Timestamp.now(),
            type: noteType,
        };
        
        const leadRef = doc(firestore, 'leads', leadId);
        
        updateDoc(leadRef, {
            notes: arrayUnion(newNote)
        }).then(() => {
            console.log("Note added to Firestore successfully");
            toast({
                title: "Note Added",
                description: "Your note has been successfully saved.",
            });
        }).catch((error) => {
            console.error("Failed to add note:", error);
            toast({
                title: "Error Adding Note",
                description: "There was a problem saving your note. Please try again.",
                variant: "destructive",
            });
        });
    }, [firestore, user, toast]);

    const handleManualNoteAdd = useCallback((leadId: string, noteContent: string) => {
        addNote(leadId, noteContent, 'Manual');
    }, [addNote]);


    const handleUpdateStage = useCallback(async (id: string, stage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', id);
        
        try {
            await updateDoc(leadRef, { stage });
            const noteContent = `Stage changed to '${stage}'`;
            addNote(id, noteContent, 'System');
        } catch (error) {
             console.error("Error updating stage:", error);
             toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
        }
        
    }, [firestore, user, addNote, toast]);

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
            date: Timestamp.now(),
            type: 'Manual'
        };

        const finalLeadData = {
            ...leadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
            notes: [initialNote]
        };

        try {
            const newDocRef = await addDoc(leadsCollection, finalLeadData);
            toast({ title: "Lead Added", description: "New lead created. Analyzing with AI..." });
            
            try {
                const leadDetails = `Name: ${newLeadData.name}, Company: ${newLeadData.company || 'N/A'}, Stage: ${newLeadData.stage}, Notes: ${noteContent}`;
                const analysisResult = await analyzeAndUpdateLead({ leadDetails });
                
                const analysisNoteContent = `AI Analysis Complete:\n- Qualification: ${analysisResult.qualificationDecision}\n- Recommendation: ${analysisResult.salesRecommendation}`;
                addNote(newDocRef.id, analysisNoteContent, 'AI Analysis');
                
                await updateDoc(newDocRef, { leadStatus: analysisResult.leadStatus });

            } catch (aiError) {
                console.error("Error during background AI analysis:", aiError);
                addNote(newDocRef.id, "Background AI analysis failed to run.", 'System');
            }

        } catch (error) {
             console.error("Error creating lead:", error);
             toast({ title: "Error creating lead", description: "Could not save the new lead.", variant: "destructive" });
        }

    }, [firestore, allStaff, user, addNote, toast]);


    const handleUpdateOwner = useCallback(async (id: string, newOwnerId: string) => {
        if (!firestore || !user) return;

        const oldOwnerName = leads.find(l => l.id === id)?.ownerName || 'Unknown';
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
            const noteContent = `Owner changed from ${oldOwnerName} to ${newOwner.name}`;
            addNote(id, noteContent, 'System');
        } catch (error) {
            console.error("Error updating owner:", error);
            toast({ title: "Error", description: "Could not update lead owner.", variant: "destructive"});
        }

    }, [firestore, user, allStaff, leads, addNote, toast]);
    
    const handleBeginAddNote = useCallback((leadId: string) => {
        setNoteLeadId(leadId);
    }, []);

    const columns = useMemo(
        () => getColumns(handleUpdateStage, handleDelete, handleUpdateOwner, addNote, handleBeginAddNote, allStaff), 
        [handleUpdateStage, handleDelete, handleUpdateOwner, addNote, handleBeginAddNote, allStaff]
    );
    
    const table = useReactTable({
      data: leads,
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
                clearAllFilters={clearAllFilters}
                loading={leadsLoading || staffLoading}
                renderSubComponent={renderSub}
            />
            <AddNoteDialog
                leadId={noteLeadId!}
                open={!!noteLeadId}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setNoteLeadId(null);
                    }
                }}
                onAddNote={handleManualNoteAdd}
            />
        </main>
    );
}


export default function LeadsPage() {
    return (
        <DateRangeProvider>
            <LeadsPageContent />
        </DateRangeProvider>
    )
}
