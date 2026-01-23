'use client';

import { useState } from 'react';
import type { Table, ColumnDef } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, X, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

interface InventoryDataTableProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  activeFilters: {key: string; value: string}[];
  setActiveFilters: React.Dispatch<React.SetStateAction<{key: string; value: string}[]>>;
}

export function InventoryDataTable<TData, TValue>({
  table,
  columns,
  loading,
  searchTerm,
  setSearchTerm,
  activeFilters,
  setActiveFilters
}: InventoryDataTableProps<TData, TValue>) {
    const router = useRouter();
    const { user } = useUser();

    const addFilter = (key: string, value: string) => {
        const otherFilters = activeFilters.filter(f => f.key !== key);
        setActiveFilters([...otherFilters, { key, value }]);
        setSearchTerm('');
    };

    const removeFilter = (key: string, value: string) => {
        setActiveFilters(activeFilters.filter(f => !(f.key === key && f.value === value)));
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setActiveFilters([]);
    }

  return (
    <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full md:max-w-md space-y-2 relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by make, model, VIN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {activeFilters.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        {activeFilters.map((f, i) => (
                            <Badge key={`${f.key}-${i}`} variant="secondary" className="capitalize text-xs">
                                <span className="font-semibold mr-1">{f.key}:</span> {f.value}
                                <button onClick={() => removeFilter(f.key, f.value)} className="ml-2 rounded-full hover:bg-black/10 p-0.5">
                                    <X size={12} />
                                </button>
                            </Badge>
                        ))}
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-auto py-1">
                            Clear All
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-start">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Status</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={activeFilters.find(f => f.key === 'status')?.value} onValueChange={(v) => addFilter('status', v)}>
                        {['Active', 'Pending', 'Sold'].map(status => (
                            <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                        ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                    <Button onClick={() => router.push('/inventory/add')} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                    </Button>
                )}
            </div>
        </div>

      <div className="rounded-md border bg-white">
        <ShadcnTable>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
                 [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={columns.length}>
                             <Skeleton className="h-12 w-full" />
                        </TableCell>
                    </TableRow>
                ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No vehicles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadcnTable>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
