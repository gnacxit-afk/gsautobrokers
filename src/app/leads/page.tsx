"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { getLeads, getStaff } from "@/lib/mock-data";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { useAuth } from "@/lib/auth";
import type { Lead } from "@/lib/types";
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
import { useDateRange, DEFAULT_DATE_RANGE } from "@/hooks/use-date-range";
import { useLeadsPage } from "@/providers/leads-page-provider";

const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];
const channels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

export default function LeadsPage() {
    const { user } = useAuth();
    const { dateRange, setDateRange } = useDateRange();
    const { setClearAllFilters } = useLeadsPage();
    const allLeads = useMemo(() => getLeads(), []);
    const allStaff = useMemo(() => getStaff(), []);

    const [leads, setLeads] = useState<Lead[]>(allLeads);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [expanded, setExpanded] = useState({});

    const filteredLeads = useMemo(() => {
        if (!user) return [];
        
        let roleFilteredLeads;
        if (user.role === 'Admin') {
            roleFilteredLeads = leads;
        } else if (user.role === 'Supervisor') {
            const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
            const visibleIds = [user.id, ...teamIds];
            roleFilteredLeads = leads.filter(l => visibleIds.includes(l.ownerId));
        } else if (user.role === 'Broker') {
            roleFilteredLeads = leads.filter(l => l.ownerId === user.id);
        } else {
            roleFilteredLeads = [];
        }

        return roleFilteredLeads.filter(l => {
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
      table.resetColumnFilters();
      setGlobalFilter('');
      setDateRange(DEFAULT_DATE_RANGE);
    }, [table, setDateRange]);

    useEffect(() => {
      setClearAllFilters(clearAllFilters);
    }, [clearAllFilters, setClearAllFilters]);

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
            />
        </main>
    );
}
