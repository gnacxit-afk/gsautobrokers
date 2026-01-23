
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, type QueryConstraint, where } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { getColumns } from './components/columns';
import { InventoryDataTable } from './components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, CheckCircle, DollarSign } from 'lucide-react';
import { matchSorter } from 'match-sorter';

const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: string, icon: React.ElementType, loading: boolean }) => (
    <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
            <Icon className={`h-5 w-5 text-primary`} />
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

export default function InventoryManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<{key: string; value: string}[]>([]);

    const inventoryQuery = useMemo(() => {
        if (!firestore) return null;
        
        const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
        activeFilters.forEach(f => {
            constraints.push(where(f.key, '==', f.value));
        });

        return query(collection(firestore, "inventory"), ...constraints);
    }, [firestore, activeFilters]);

    const { data: vehicles, loading } = useCollection<Vehicle>(inventoryQuery);

    const filteredData = useMemo(() => {
        if (!vehicles) return [];
        if (!searchTerm) return vehicles;
        return matchSorter(vehicles, searchTerm, {
            keys: ['make', 'model', 'trim', 'vin', 'stockNumber'],
        });
    }, [vehicles, searchTerm]);

    const inventoryMetrics = useMemo(() => {
        if (!vehicles) return { total: 0, active: 0, sold: 0 };
        return {
            total: vehicles.length,
            active: vehicles.filter(v => v.status === 'Active').length,
            sold: vehicles.filter(v => v.status === 'Sold').length,
        };
    }, [vehicles]);
    
    const columns = useMemo(() => getColumns(), []);

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            globalFilter: searchTerm,
        },
        onGlobalFilterChange: setSearchTerm,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });


    return (
        <main className="flex flex-1 flex-col gap-6">
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Vehicles" value={`${inventoryMetrics.total}`} icon={Car} loading={loading} />
                <StatCard title="Active Listings" value={`${inventoryMetrics.active}`} icon={CheckCircle} loading={loading} />
                <StatCard title="Sold Vehicles" value={`${inventoryMetrics.sold}`} icon={DollarSign} loading={loading} />
            </div>
            <InventoryDataTable
                table={table}
                columns={columns}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeFilters={activeFilters}
                setActiveFilters={setActiveFilters}
            />
        </main>
    )
}

    