
'use client';

import { useState } from 'react';
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
import { UserPlus, Search, X } from 'lucide-react';
import type { Staff } from '@/lib/types';
import { NewStaffDialog } from './new-staff-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SendNotificationDialog } from './send-notification-dialog';

interface StaffDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: Table<TData>;
  loading: boolean;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  allStaff: Staff[];
}

export function StaffDataTable<TData, TValue>({
  columns,
  table,
  loading,
  globalFilter,
  setGlobalFilter,
  allStaff,
}: StaffDataTableProps<TData, TValue>) {

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search staff..."
                    value={globalFilter ?? ''}
                    onChange={event => setGlobalFilter(event.target.value)}
                    className="pl-10"
                />
                 {globalFilter && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setGlobalFilter('')}
                    >
                        <X size={14} />
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
                  No staff members found.
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
