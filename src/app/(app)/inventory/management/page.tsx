
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, type QueryConstraint, where } from 'firebase/firestore';
import type { Vehicle, Staff } from '@/lib/types';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { getColumns } from './components/columns';
import { InventoryDataTable } from './components/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, CheckCircle, DollarSign } from 'lucide-react';
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

export default function InventoryManagementPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { dateRange } = useDateRange();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<{key: string; value: string}[]>([]);
    const [ownerFilter, setOwnerFilter] = useState('all');

    const staffQuery = useMemo(() => (firestore && user) ? query(collection(firestore, 'staff')) : null, [firestore, user]);
    const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);

    const inventoryQuery = useMemo(() => {
        if (!firestore || !user) return null;
        
        const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
        activeFilters.forEach(f => {
            constraints.push(where(f.key, '==', f.value));
        });

        return query(collection(firestore, "inventory"), ...constraints);
    }, [firestore, user, activeFilters]);

    const { data: vehicles, loading: vehiclesLoading } = useCollection<Vehicle>(inventoryQuery);
    
    const loading = vehiclesLoading || staffLoading;

    const filteredByDateAndOwner = useMemo(() => {
        if (!vehicles || !isClient) return [];
        let filtered = vehicles;
        
        // Date range filter
        if (dateRange.start && dateRange.end) {
            filtered = filtered.filter(v => {
                 const date = (v.createdAt as any)?.toDate ? (v.createdAt as any).toDate() : new Date(v.createdAt as string);
                 return isValid(date) && isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
            })
        }
        // Owner filter for Admins
        if (user?.role === 'Admin' && ownerFilter !== 'all') {
            filtered = filtered.filter(v => v.soldBy === ownerFilter);
        }

        return filtered;
    }, [vehicles, dateRange, ownerFilter, user, isClient]);

    const inventoryMetrics = useMemo(() => {
        const dataToProcess = filteredByDateAndOwner;
        if (!dataToProcess) return { total: 0, active: 0, sold: 0 };
        
        if (user?.role === 'Supervisor' && allStaff) {
             const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id).concat(user.id);
             const teamSold = dataToProcess.filter(v => v.status === 'Sold' && v.soldBy && teamIds.includes(v.soldBy)).length;
             return {
                total: dataToProcess.length,
                active: dataToProcess.filter(v => v.status === 'Active').length,
                sold: teamSold,
            };
        }
        
        return {
            total: dataToProcess.length,
            active: dataToProcess.filter(v => v.status === 'Active').length,
            sold: dataToProcess.filter(v => v.status === 'Sold').length,
        };
    }, [filteredByDateAndOwner, user, allStaff]);
    
    const tableData = useMemo(() => {
        if (!vehicles) return [];
        if (!searchTerm) return vehicles;
        return matchSorter(vehicles, searchTerm, {
            keys: ['make', 'model', 'trim', 'vin', 'stockNumber'],
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
                {user?.role === 'Admin' && (
                     <div className="flex gap-2 items-center">
                        <DateRangePicker />
                        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by user" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {allStaff?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Vehicles" value={`${inventoryMetrics.total}`} icon={Car} loading={loading || !isClient} />
                <StatCard title="Active Listings" value={`${inventoryMetrics.active}`} icon={CheckCircle} loading={loading || !isClient} />
                {user?.role !== 'Broker' && (
                    <StatCard title="Sold Vehicles" value={`${inventoryMetrics.sold}`} icon={DollarSign} loading={loading || !isClient} />
                )}
            </div>
            <InventoryDataTable
                table={table}
                columns={columns}
                loading={loading || !isClient}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeFilters={activeFilters}
                setActiveFilters={setActiveFilters}
            />
        </main>
    )
}
