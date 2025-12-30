"use client";

import { useState, useMemo, useCallback } from "react";
import { getLeads, getStaff } from "@/lib/mock-data";
import { getColumns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { useAuth } from "@/lib/auth";
import type { Lead } from "@/lib/types";

export default function LeadsPage() {
    const { user } = useAuth();
    const allLeads = getLeads();
    const allStaff = getStaff();

    const [leads, setLeads] = useState<Lead[]>(allLeads);

    const filteredLeads = useMemo(() => {
        if (user.role === 'Admin') {
            return leads;
        }
        if (user.role === 'Supervisor') {
            const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
            const visibleIds = [user.id, ...teamIds];
            return leads.filter(l => visibleIds.includes(l.ownerId));
        }
        if (user.role === 'Broker') {
            return leads.filter(l => l.ownerId === user.id);
        }
        return [];
    }, [user, leads, allStaff]);

    const handleUpdateStatus = useCallback((id: string, status: Lead['status']) => {
        setLeads(prevLeads => prevLeads.map(lead => 
            lead.id === id ? { ...lead, status } : lead
        ));
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (window.confirm('Are you sure you want to delete this lead?')) {
            setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
        }
    }, []);

    const columns = useMemo(() => getColumns(handleUpdateStatus, handleDelete), [handleUpdateStatus, handleDelete]);

    return (
        <main className="flex flex-1 flex-col gap-4">
            <DataTable columns={columns} data={filteredLeads} />
        </main>
    );
}
