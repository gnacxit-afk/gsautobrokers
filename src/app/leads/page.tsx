
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useFirestore, useUser, useCollection } from '@/firebase';
import { useRouter } from "next/navigation";
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
import { collection, query, orderBy, updateDoc, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, isValid } from "date-fns";


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

const createNotification = async (
    firestore: any,
    userId: string,
    lead: Lead,
    content: string
) => {
    const notificationsCollection = collection(firestore, 'notifications');
    await addDoc(notificationsCollection, {
        userId,
        leadId: lead.id,
        leadName: lead.name,
        content,
        createdAt: serverTimestamp(),
        read: false,
    });
};


function LeadsPageContent() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { dateRange } = useDateRange();
    const router = useRouter();
    
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    // Stabilize the query object with useMemo.
    const leadsQuery = useMemo(() => 
        firestore ? query(collection(firestore, 'leads'), orderBy('createdAt', 'desc')) : null,
    [firestore]);

    const staffQuery = useMemo(() => 
        firestore ? query(collection(firestore, 'staff')) : null,
    [firestore]);

    const { data: leadsSnapshot, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
    const { data: staffSnapshot, loading: staffLoading } = useCollection<Staff>(staffQuery);

    const [data, setData] = useState<Lead[]>([]);
    const staffData = useMemo(() => staffSnapshot || [], [staffSnapshot]);

    useEffect(() => {
        if (!leadsSnapshot) return;
        // Map snapshot to data, ensuring 'id' is included.
        const nextData = leadsSnapshot.map(doc => ({
            id: doc.id,
            ...(doc as Omit<Lead, "id">),
        }));

        // Prevent unnecessary re-renders by comparing the new data with the old.
        // This is a simple but effective way to stabilize the data flow.
        setData(prev => JSON.stringify(prev) === JSON.stringify(nextData) ? prev : nextData);
    }, [leadsSnapshot]);
    
    const addNoteEntry = useCallback(async (leadId: string, content: string, type: 'Manual' | 'Stage Change' | 'Owner Change' | 'System') => {
        if (!firestore || !user) return;
        const noteHistoryRef = collection(firestore, 'leads', leadId, 'noteHistory');
        
        await addDoc(noteHistoryRef, {
            content,
            author: user.name,
            date: serverTimestamp(),
            type,
        });
        
        // Also update the parent lead to trigger real-time updates on the table
        const leadRef = doc(firestore, 'leads', leadId);
        await updateDoc(leadRef, { lastActivity: serverTimestamp() });

    }, [firestore, user]);

    const handleUpdateStage = useCallback(async (lead: Lead, newStage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', lead.id);
        
        try {
            await updateDoc(leadRef, { stage: newStage });
            const noteContent = `Stage changed from '${lead.stage}' to '${newStage}' by ${user.name}`;
            await addNoteEntry(lead.id, noteContent, 'Stage Change');
            
            // Create notification for the lead owner
            if (lead.ownerId !== user.id) {
                await createNotification(
                    firestore,
                    lead.ownerId,
                    lead,
                    `Stage for lead ${lead.name} was changed to ${newStage} by ${user.name}.`
                );
            }
            toast({ title: "Stage Updated", description: `Lead "${lead.name}" is now ${newStage}.` });
        } catch (error) {
             console.error("Error updating stage:", error);
             toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
        }
    }, [firestore, user, toast, addNoteEntry]);

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
        if (!firestore || !user || !staffData) return;
        const owner = staffData.find(s => s.id === newLeadData.ownerId);
        if (!owner) {
             toast({ title: "Error", description: "Could not find lead owner.", variant: "destructive" });
             return;
        };

        const leadsCollection = collection(firestore, 'leads');
        
        const finalLeadData = {
            ...newLeadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        };

        try {
            const newDocRef = await addDoc(leadsCollection, finalLeadData);
            await addNoteEntry(newDocRef.id, "Lead created.", "System");
            toast({ title: "Lead Added", description: "New lead created successfully." });
        } catch (error) {
             console.error("Error creating lead:", error);
             toast({ title: "Error creating lead", description: "Could not save the new lead.", variant: "destructive" });
        }
    }, [firestore, staffData, user, toast, addNoteEntry]);

    const handleUpdateOwner = useCallback(async (id: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => {
        if (!firestore || !user || !staffData) return;
        
        const leadRef = doc(firestore, 'leads', id);

        const updateData = { 
            ownerId: newOwnerId, 
            ownerName: newOwnerName,
        };
        
        try {
            const leadDoc = data.find(l => l.id === id);
            if (!leadDoc) throw new Error("Lead not found");

            await updateDoc(leadRef, updateData);
            const noteContent = `Owner changed from '${oldOwnerName}' to '${newOwnerName}' by ${user.name}`;
            await addNoteEntry(id, noteContent, 'Owner Change');
            
            // Notify new owner
            if (newOwnerId !== user.id) {
                await createNotification(
                    firestore,
                    newOwnerId,
                    leadDoc,
                    `You have been assigned a new lead: ${leadDoc.name}.`
                );
            }
            // Notify old owner
            const oldOwner = staffData.find(s => s.name === oldOwnerName);
            if (oldOwner && oldOwner.id !== user.id) {
                 await createNotification(
                    firestore,
                    oldOwner.id,
                    leadDoc,
                    `Lead ${leadDoc.name} was reassigned to ${newOwnerName}.`
                );
            }
            
            toast({ title: "Owner Updated", description: `${leadDoc.name} is now assigned to ${newOwnerName}.` });
        } catch (error) {
            console.error("Error updating owner:", error);
            toast({ title: "Error", description: "Could not update lead owner.", variant: "destructive"});
        }

    }, [firestore, user, staffData, toast, addNoteEntry, data]);

    // ** CRITICAL FIX **
    // Memoize the columns definition to prevent re-creation on every render.
    // The dependencies array includes all handlers. Since the handlers are
    // wrapped in useCallback, they are stable, making the columns stable too.
    const columns = useMemo(
        () => getColumns(handleUpdateStage, handleDelete, handleUpdateOwner, staffData), 
        [handleUpdateStage, handleDelete, handleUpdateOwner, staffData]
    );
    
    // ** CRITICAL FIX **
    // This provides a stable reference to the data for the table.
    const memoizedData = useMemo(() => data, [data]);

    const memoizedMeta = useMemo(() => ({
      user,
      allStaff: staffData,
      dateRange
    }), [user, staffData, dateRange]);
    
    const table = useReactTable({
      data: memoizedData, 
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
      getRowCanExpand: () => false, // No expandable rows in this table
      // Pass memoized meta data to the table for the global filter
      meta: memoizedMeta
    });

    const clearAllFilters = useCallback(() => {
        table.setGlobalFilter('');
        table.setColumnFilters([]);
    }, [table]);

    return (
        <>
            <main className="flex flex-1 flex-col gap-4">
                <DataTable 
                    table={table}
                    columns={columns}
                    onAddLead={handleAddLead}
                    staff={staffData || []}
                    stages={leadStages}
                    channels={channels}
                    clearAllFilters={clearAllFilters}
                    loading={leadsLoading || staffLoading}
                />
            </main>
        </>
    );
}


export default function LeadsPage() {
    // This wrapper component ensures that the main logic is a client component
    // while the export remains a default export for Next.js page conventions.
    return (
        <LeadsPageContent />
    )
}
