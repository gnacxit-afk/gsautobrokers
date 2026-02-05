'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, type QueryConstraint, where } from 'firebase/firestore';
import type { Vehicle, Staff, Dealership } from '@/lib/types';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { getColumns } from './components/columns';
import { InventoryDataTable } from './components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, CheckCircle, DollarSign, Building } from 'lucide-react';
import { matchSorter } from 'match-sorter';
import { useDateRange } from '@/hooks/use-date-range';
import { isWithinInterval, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/layout/date-range-picker';

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

const DealershipStatCard = ({ name, total, sold, loading }: { name: string, total: number, sold: number, loading: boolean }) => (
    <Card className="shadow-sm">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-5 w-5 text-muted-foreground" />
                {name}
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
             <div>
                <p className="text-xs text-muted-foreground">Total Vehicles</p>
                {loading ? <Skeleton className="h-6 w-1/2 mt-1" /> : <p className="text-lg font-bold">{total}</p>}
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Sold Vehicles</p>
                {loading ? <Skeleton className="h-6 w-1/2 mt-1" /> : <p className="text-lg font-bold">{sold}</p>}
            </div>
        </CardContent>
    </Card>
)

export default function InventoryManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<{key: string; value: string}[]>([]);

    const staffQuery = useMemo(() => (firestore && user) ? query(collection(firestore, 'staff')) : null, [firestore, user]);
    const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);
    
    const dealershipsQuery = useMemo(() => firestore ? query(collection(firestore, 'dealerships')) : null, [firestore]);
    const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(dealershipsQuery);

    const inventoryQuery = useMemo(() => {
        if (!firestore || !user) return null;
        
        const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
        activeFilters.forEach(f => {
            constraints.push(where(f.key, '==', f.value));
        });

        return query(collection(firestore, "inventory"), ...constraints);
    }, [firestore, user, activeFilters]);

    const { data: vehicles, loading: vehiclesLoading } = useCollection<Vehicle>(inventoryQuery);
    
    const loading = vehiclesLoading || staffLoading || dealershipsLoading;

    const dealershipMetrics = useMemo(() => {
        if (!vehicles || !dealerships) return [];
        return dealerships.map(dealership => {
            const dealershipVehicles = vehicles.filter(v => v.dealershipId === dealership.id);
            return {
                id: dealership.id,
                name: dealership.name,
                total: dealershipVehicles.length,
                sold: dealershipVehicles.filter(v => v.status === 'Sold').length
            };
        });
    }, [vehicles, dealerships]);
    
    const tableData = useMemo(() => {
        if (!vehicles) return [];
        if (!searchTerm) return vehicles;
        return matchSorter(vehicles, searchTerm, {
            keys: ['make', 'model', 'trim', 'stockNumber'],
        });
    }, [vehicles, searchTerm]);
    
    const columns = useMemo(() => getColumns(), []);

    const table = useReactTable({
        data: tableData,
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
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold">Inventory Management</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
                ) : dealershipMetrics.map(metric => (
                    <DealershipStatCard key={metric.id} {...metric} loading={loading} />
                ))}
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
