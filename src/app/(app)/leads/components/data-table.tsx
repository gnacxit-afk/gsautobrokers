
'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Table, ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
} from '@tanstack/react-table';

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
import { PlusCircle, Search, X } from 'lucide-react';
import type { Lead, Staff } from '@/lib/types';
import { AddLeadDialog } from './add-lead-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/layout/date-range-picker';
import { useUser } from '@/firebase';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: Table<TData>;
  onAddLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'> & { initialNotes?: string }, callback?: (lead: Lead) => void) => void;
  staff: Staff[];
  clearAllFilters: () => void;
  loading: boolean;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  table,
  onAddLead,
  staff,
  clearAllFilters,
  loading,
  globalFilter,
  setGlobalFilter,
}: DataTableProps<TData, TValue>) {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const { user } = useUser();

  const handleOpenAddLeadDialog = useCallback(() => {
    setIsAddLeadOpen(true);
  }, []);

  const assignableStaff = useMemo(() => {
    if (!user || !staff) return [];
    if (user.role === 'Admin') {
      return staff.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin');
    }
    if (user.role === 'Supervisor') {
        const teamIds = staff.filter(s => s.supervisorId === user.id).map(s => s.id);
        return staff.filter(s => teamIds.includes(s.id) || s.id === user.id);
    }
    if (user.role === 'Broker') {
      return staff.filter(s => s.id === user.id);
    }
    return [];
  }, [user, staff]);
  
  const defaultOwnerId = useMemo(() => {
      if (user?.role === 'Broker') return user.id;
      return assignableStaff.length > 0 ? assignableStaff[0].id : '';
  }, [user, assignableStaff]);

  return (
    <div className="space-y-4">
       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search leads (e.g., John Doe, owner:Jane, stage:Nuevo)"
                    value={globalFilter ?? ''}
                    onChange={event => setGlobalFilter(event.target.value)}
                    className="pl-10"
                />
                 {globalFilter && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={clearAllFilters}
                    >
                        <X size={14} />
                    </Button>
                )}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <DateRangePicker />
                <Button onClick={handleOpenAddLeadDialog} className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
                </Button>
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
                 [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={columns.length}>
                             <Skeleton className="h-8 w-full" />
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
                  No results.
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
      <AddLeadDialog 
        isOpen={isAddLeadOpen} 
        onOpenChange={setIsAddLeadOpen}
        onAddLead={onAddLead}
        staff={assignableStaff}
        defaultOwnerId={defaultOwnerId}
      />
    </div>
  );
}
