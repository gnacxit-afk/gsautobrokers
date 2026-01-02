"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { useAuth } from "@/lib/auth";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
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
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';

const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

export default function LeadsPage() {
    const { user } = useAuth();
    const firestore = useFirestore();

    const leadsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'leads') : null), [firestore]);
    const staffQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'staff') : null), [firestore]);

    const { data: leadsData, loading: leadsLoading } = useCollection(leadsQuery);
    const { data: staffData, loading: staffLoading } = useCollection(staffQuery);
    
    const allLeads = useMemo(() => (leadsData as Lead[]) || [], [leadsData]);
    const allStaff = useMemo(() => (staffData as Staff[]) || [], [staffData]);

    const { dateRange, setDateRange } = useDateRange();

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    const filteredLeads = useMemo(() => {
        let visibleLeads = allLeads;
        if (user) {
            if (user.role === 'Admin') {
                // Admin sees all leads
            } else if (user.role === 'Supervisor') {
                const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
                const visibleIds = [user.id, ...teamIds];
                visibleLeads = allLeads.filter(l => visibleIds.includes(l.ownerId));
            } else if (user.role === 'Broker') {
                visibleLeads = allLeads.filter(l => l.ownerId === user.id);
            } else {
                visibleLeads = [];
            }
        } else {
            visibleLeads = [];
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
        await updateDoc(leadRef, { status });
    }, [firestore]);
    
    const handleUpdateNotes = useCallback(async (id: string, notes: string) => {
        if (!firestore) return;
        const leadRef = doc(firestore, 'leads', id);
        await updateDoc(leadRef, { notes });
    }, [firestore]);

    const handleDelete = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
            await deleteDoc(doc(firestore, 'leads', id));
        }
    }, [firestore]);

    const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => {
        const owner = allStaff.find(s => s.id === newLeadData.ownerId);
        if (!owner || !firestore) return;

        const leadsCollection = collection(firestore, 'leads');
        await addDoc(leadsCollection, {
            ...newLeadData,
            createdAt: serverTimestamp(),
            ownerName: owner.name,
        });
    }, [allStaff, firestore]);


    const columns = useMemo(() => getColumns(handleUpdateStatus, handleDelete), [handleUpdateStatus, handleDelete]);
    
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
