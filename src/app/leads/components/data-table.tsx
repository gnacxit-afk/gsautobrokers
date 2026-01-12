
"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  Table as ReactTable,
  Row,
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
import { Plus, Search, XCircle } from "lucide-react";
import { NewLeadDialog } from "./new-lead-dialog";
import { Input } from "@/components/ui/input";
import type { Lead, Staff } from "@/lib/types";
import { DateRangePicker } from "@/components/layout/date-range-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/lib/auth";


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: ReactTable<TData>;
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => void;
  staff: Staff[];
  clearAllFilters: () => void;
  loading: boolean;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}

export function DataTable<TData extends Lead, TValue>({
  columns,
  table,
  onAddLead,
  staff,
  clearAllFilters,
  loading,
  globalFilter,
  setGlobalFilter,
}: DataTableProps<TData, TValue>) {
  
  const { user } = useAuthContext();
  const [isNewLeadDialogOpen, setNewLeadDialogOpen] = React.useState(false);

  return (
    <div className="space-y-6">
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search name, phone, or filter with 'stage:Nuevo', 'owner:Ana'..."
                        value={globalFilter ?? ''}
                        onChange={event => setGlobalFilter(event.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <NewLeadDialog 
                  open={isNewLeadDialogOpen} 
                  onOpenChange={setNewLeadDialogOpen}
                  onAddLead={onAddLead}
                >
                    <Button 
                        onClick={() => setNewLeadDialogOpen(true)}
                        className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} /> Add Lead
                    </Button>
                </NewLeadDialog>
            </div>
             <div className="flex flex-col md:flex-row gap-4 w-full">
                <div className="flex-shrink-0">
                   <DateRangePicker />
                </div>
                 <div className="flex-grow"></div>
                 <Button
                    onClick={clearAllFilters}
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <XCircle className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
            </div>
        </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-6 py-4 font-semibold text-sm">
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
          <TableBody className="divide-y">
            {loading ? (
                [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                        {[...Array(columns.length)].map((_, j) => (
                            <TableCell key={j} className="px-6 py-4">
                                <Skeleton className="h-5 w-full" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No leads found for the current filters.
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
