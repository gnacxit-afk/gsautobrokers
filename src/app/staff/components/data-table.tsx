
'use client';

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  Table as ReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Staff } from '@/lib/types';

interface DataTableProps {
  table: ReactTable<Staff>;
  columns: ColumnDef<Staff>[];
  loading: boolean;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  allStaff: Staff[];
}

export function StaffDataTable({
  table,
  columns,
  loading,
  globalFilter,
  setGlobalFilter,
  allStaff,
}: DataTableProps) {
  const roleFilter = table.getColumn("role")?.getFilterValue() as string | undefined;

  const handleRoleFilterChange = (value: string) => {
    table.getColumn("role")?.setFilterValue(value === "all" ? undefined : value);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
                placeholder="Search by name or email..."
                value={globalFilter ?? ''}
                onChange={event => setGlobalFilter(event.target.value)}
                className="w-full pl-10 pr-4 py-2"
            />
        </div>
        <div className="flex items-center gap-2">
           <Select
              value={roleFilter || 'all'}
              onValueChange={handleRoleFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Broker">Broker</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                        {columns.map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                    </TableRow>
                ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
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
        </Table>
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
