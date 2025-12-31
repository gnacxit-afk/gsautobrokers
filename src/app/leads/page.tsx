"use client";

import { useState, useMemo, useCallback } from "react";
import { getLeads, getStaff } from "@/lib/mock-data";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { useAuth } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import { useDateRange, getDefaultDateRange } from "@/hooks/use-date-range";
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

const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

export default function LeadsPage() {
    const { user } = useAuth();
    const allLeads = useMemo(() => getLeads(), []);
    const allStaff = useMemo(() => getStaff(), []);
    const { dateRange, setDateRange } = useDateRange();

    const [leads, setLeads] = useState<Lead[]>(allLeads);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    const filteredLeads = useMemo(() => {
        let visibleLeads = leads;
        if (user) {
            if (user.role === 'Admin') {
                // Admin sees all leads
            } else if (user.role === 'Supervisor') {
                const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
                const visibleIds = [user.id, ...teamIds];
                visibleLeads = leads.filter(l => visibleIds.includes(l.ownerId));
            } else if (user.role === 'Broker') {
                visibleLeads = leads.filter(l => l.ownerId === user.id);
            } else {
                visibleLeads = [];
            }
        } else {
            visibleLeads = [];
        }

        // Check if the default range is being used. If so, don't filter by date.
        const defaultRange = getDefaultDateRange();
        const isDefaultRange = dateRange.start.getTime() === defaultRange.start.getTime() && dateRange.end.getTime() === defaultRange.end.getTime();

        if (isDefaultRange) {
          // This logic is a bit tricky, the default should now show everything. Let's make it wide open.
           const wideOpenStart = new Date('2000-01-01');
           const wideOpenEnd = new Date('2100-01-01');
            return visibleLeads.filter(l => {
              const leadDate = new Date(l.createdAt);
              return leadDate >= wideOpenStart && leadDate <= wideOpenEnd;
          });
        }

        return visibleLeads.filter(l => {
            const leadDate = new Date(l.createdAt);
            return leadDate >= dateRange.start && leadDate <= dateRange.end;
        });

    }, [user, leads, allStaff, dateRange]);

    const handleUpdateStatus = useCallback((id: string, status: Lead['status']) => {
        setLeads(prevLeads => prevLeads.map(lead => 
            lead.id === id ? { ...lead, status } : lead
        ));
    }, []);
    
    const handleUpdateNotes = useCallback((id: string, notes: string) => {
        setLeads(prevLeads => prevLeads.map(lead =>
            lead.id === id ? { ...lead, notes } : lead
        ));
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
        }
    }, []);

    const handleAddLead = useCallback((newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => {
        const owner = allStaff.find(s => s.id === newLeadData.ownerId);
        if (!owner) return;

        const newLead: Lead = {
            ...newLeadData,
            id: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            ownerName: owner.name,
        };
        setLeads(prevLeads => [newLead, ...prevLeads]);
    }, [allStaff]);


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
            />
        </main>
    );
}
