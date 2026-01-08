
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useFirestore, useUser, useCollection } from '@/firebase';
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
import { collection, query, orderBy, updateDoc, doc, deleteDoc, addDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, isValid } from "date-fns";
import { AddNoteDialog } from "./components/add-note-dialog";
import { AnalyzeLeadDialog } from "./components/analyze-lead-dialog";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

// This function is now outside the component, so it's not recreated on every render.
const globalFilterFn: FilterFn<any> = (row, columnId, filterValue, addMeta) => {
    const search = filterValue.toLowerCase();

    // Access the full original data object
    const lead = row.original as Lead;
    
    // Access global filter context if needed (passed from table options)
    const { user, allStaff, dateRange } = addMeta as any;

    // Date Range Filtering
    if (lead.createdAt) {
        const leadDate = (lead.createdAt as any).toDate ? (lead.createdAt as any).toDate() : new Date(lead.createdAt as string);
        if (isValid(leadDate)) {
            if (!isWithinInterval(leadDate, { start: dateRange.start, end: dateRange.end })) {
                return false; // Exclude if outside date range
            }
        }
    }

    // Role-based Filtering
    if (user) {
        let isVisible = false;
        if (user.role === 'Admin') {
            isVisible = true;
        } else if (user.role === 'Supervisor') {
            const teamIds = allStaff.filter((s: Staff) => s.supervisorId === user.id).map((s: Staff) => s.id);
            const visibleIds = [user.id, ...teamIds];
            isVisible = visibleIds.includes(lead.ownerId);
        } else if (user.role === 'Broker') {
            isVisible = lead.ownerId === user.id;
        }
        if (!isVisible) {
            return false; // Exclude if not visible to the user's role
        }
    } else {
        return false; // No user, no data
    }

    // Original search filtering
    const nameMatch = lead.name?.toLowerCase().includes(search);
    const emailMatch = lead.email?.toLowerCase().includes(search);
    const phoneMatch = lead.phone?.toLowerCase().includes(search);
    const ownerNameMatch = lead.ownerName?.toLowerCase().includes(search);
    
    return nameMatch || emailMatch || phoneMatch || ownerNameMatch;
};


function LeadsPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [staffData, setStaffData] = useState<Staff[]>([]);
    
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [analyzingLead, setAnalyzingLead] = useState<Lead | null>(null);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    // Stabilize the query object with useMemo.
    const leadsQuery = useMemo(() => 
        firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null,
    [firestore]);

    const { data: leadsData, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

    const [data, setData] = useState<Lead[]>([]);
    useEffect(() => {
        setData(leadsData || []);
    }, [leadsData]);


    useEffect(() => {
        if (!firestore) return;
        
        const staffQuery = collection(firestore, 'staff');
        const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
            const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
            setStaffData(staff);
        });

        return () => unsubStaff();
    }, [firestore]);
    

    const handleSaveNote = useCallback(async (leadId: string, noteContent: string) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', leadId);
        try {
            await updateDoc(leadRef, { note: noteContent });
            toast({
                title: "Note Saved",
                description: "The note has been successfully updated.",
            });
        } catch (error) {
            console.error("Failed to save note:", error);
            toast({
                title: "Error Saving Note",
                description: "There was a problem saving the note.",
                variant: "destructive",
            });
        }
    }, [firestore, toast]);


    const handleUpdateStage = useCallback(async (id: string, stage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', id);
        
        try {
            await updateDoc(leadRef, { stage });
            toast({ title: "Stage Updated", description: `Lead stage changed to '${stage}'.` });
        } catch (error) {
             console.error("Error updating stage:", error);
             toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
        }
        
    }, [firestore, user, toast]);

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

    const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => {
        if (!firestore || !user) return;
        const owner = staffData.find(s => s.id === newLeadData.ownerId);
        if (!owner) {
             toast({ title: "Error", description: "Could not find lead owner.", variant: "destructive" });
             return;
        };

        const { ...leadData } = newLeadData;

        const leadsCollection = collection(firestore, 'leads');
        
        const finalLeadData = {
            ...leadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        };

        try {
            await addDoc(leadsCollection, finalLeadData);
            toast({ title: "Lead Added", description: "New lead created successfully." });
        } catch (error) {
             console.error("Error creating lead:", error);
             toast({ title: "Error creating lead", description: "Could not save the new lead.", variant: "destructive" });
        }

    }, [firestore, staffData, user, toast]);


    const handleUpdateOwner = useCallback(async (id: string, newOwnerId: string) => {
        if (!firestore || !user || !leadsData) return;
        
        const newOwner = staffData.find(s => s.id === newOwnerId);
        
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
            toast({ title: "Owner Updated", description: `Lead owner changed to ${newOwner.name}.` });
        } catch (error) {
            console.error("Error updating owner:", error);
            toast({ title: "Error", description: "Could not update lead owner.", variant: "destructive"});
        }

    }, [firestore, user, staffData, leadsData, toast]);
    
    const handleBeginAddNote = useCallback((lead: Lead) => {
        setEditingLead(lead);
    }, []);
    
    const handleBeginAnalyze = useCallback((lead: Lead) => {
        setAnalyzingLead(lead);
    }, []);
    
    const handleAnalysisComplete = useCallback((leadId: string, leadStatus: string) => {
        // This function is for potential future use, like updating lead status after analysis.
    }, []);
    
    const handleAddAINote = useCallback((leadId: string, analysisContent: string) => {
        const lead = leadsData?.find(l => l.id === leadId);
        if (!lead) return;

        const separator = "\n\n---\n\n";
        const newNoteContent = `${lead.note || ''}${separator}**AI Analysis Result:**\n${analysisContent}`;
        handleSaveNote(leadId, newNoteContent);

    }, [leadsData, handleSaveNote]);


    const columns = useMemo(
        () => getColumns(handleUpdateStage, handleDelete, handleUpdateOwner, handleBeginAddNote, handleBeginAnalyze, staffData), 
        [handleUpdateStage, handleDelete, handleUpdateOwner, handleBeginAddNote, handleBeginAnalyze, staffData]
    );
    
    const { dateRange, setDateRange } = useDateRange();
    
    const table = useReactTable({
      data,
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
      getRowCanExpand: () => false, // Sub-components are disabled in this simplified view
       // Pass context to the global filter function
      globalFilterFnContext: {
        user,
        allStaff: staffData,
        dateRange
      }
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
                staff={staffData}
                stages={leadStages}
                channels={channels}
                clearAllFilters={clearAllFilters}
                loading={leadsLoading}
            />
            <AddNoteDialog
                lead={editingLead}
                open={!!editingLead}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setEditingLead(null);
                    }
                }}
                onSaveNote={handleSaveNote}
            />
             {analyzingLead && (
                <AnalyzeLeadDialog
                    lead={analyzingLead}
                    open={!!analyzingLead}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setAnalyzingLead(null);
                        }
                    }}
                    onAnalysisComplete={handleAnalysisComplete}
                    onAddNote={handleAddAINote}
                />
            )}
        </main>
    );
}


export default function LeadsPage() {
    return (
        <LeadsPageContent />
    )
}
