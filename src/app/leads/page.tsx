
"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useCollection, useFirestore, useUser, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { doc } from "firebase/firestore";

const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];
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
        let visibleLeads = allLeads;

        if (user) {
            if (user.role === 'Supervisor') {
                const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
                const visibleIds = [user.id, ...teamIds];
                visibleLeads = allLeads.filter(l => visibleIds.includes(l.ownerId));
            } else if (user.role === 'Broker') {
                visibleLeads = allLeads.filter(l => l.ownerId === user.id);
            }
            // For 'Admin', we don't filter by owner, so all leads remain visible.
        } else {
            visibleLeads = []; // If no user, show no leads.
        }

        return visibleLeads.filter(l => {
            if (!l.createdAt) return false;
            const leadDate = (l.createdAt as any).toDate ? (l.createdAt as any).toDate() : new Date(l.createdAt as string);
            return leadDate >= dateRange.start && leadDate <= dateRange.end;
        });

    }, [user, allLeads, allStaff, dateRange]);

    const handleUpdateStatus = useCallback(async (id: string, status: Lead['status']) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { status });
        toast({ title: "Status Updated", description: `Lead status changed to ${status}.` });
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
        addDocumentNonBlocking(leadsCollection, {
            ...newLeadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        });
        toast({ title: "Lead Added", description: "The new lead has been created." });
    }, [allStaff, firestore, toast]);

    const handleUpdateOwner = useCallback(async (id: string, newOwner: Staff) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        updateDocumentNonBlocking(leadRef, { ownerId: newOwner.id, ownerName: newOwner.name });
        toast({ title: "Owner Updated", description: `Lead reassigned to ${newOwner.name}.` });
    }, [firestore, toast]);


    const columns = useMemo(() => getColumns(handleUpdateStatus, handleDelete, handleUpdateOwner, allStaff), [handleUpdateStatus, handleDelete, handleUpdateOwner, allStaff]);
    
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
          start: new Date('2000-01-01'),
          end: new Date('2100-01-01'),
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
                statuses={leadStatuses}
                channels={channels}
                clearAllFilters={clearAllFilters}
                loading={leadsLoading || staffLoading}
            />
        </main>
    );
}
