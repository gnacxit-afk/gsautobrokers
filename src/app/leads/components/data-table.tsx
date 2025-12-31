"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  Table as ReactTable,
  Row,
} from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { NewLeadDialog } from "./new-lead-dialog";
import { Input } from "@/components/ui/input";
import type { Lead, Staff } from "@/lib/types";
import { RenderSubComponent } from "./render-sub-component";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: ReactTable<TData>;
  onUpdateNotes: (id: string, notes: string) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'ownerName'>) => void;
  staff: Staff[];
  statuses: Lead['status'][];
  channels: Lead['channel'][];
}

export function DataTable<TData extends Lead, TValue>({
  columns,
  table,
  onUpdateNotes,
  onAddLead,
  staff,
  statuses,
  channels,
}: DataTableProps<TData, TValue>) {
  
  const [isNewLeadDialogOpen, setNewLeadDialogOpen] = React.useState(false);
  const globalFilter = table.getState().globalFilter;
  const setGlobalFilter = (filter: string) => table.setGlobalFilter(filter);

  const ownerFilter = table.getColumn("ownerName")?.getFilterValue() as string | undefined;
  const statusFilter = table.getColumn("status")?.getFilterValue() as string | undefined;
  const channelFilter = table.getColumn("channel")?.getFilterValue() as string | undefined;

  const setOwnerFilter = (value: string) => table.getColumn("ownerName")?.setFilterValue(value);
  const setStatusFilter = (value: string) => table.getColumn("status")?.setFilterValue(value);
  const setChannelFilter = (value: string) => table.getColumn("channel")?.setFilterValue(value);

  return (
    <div className="space-y-6">
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by name, company..."
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
             <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Owner" />
                        </SelectTrigger>
                        <SelectContent>
                            {staff.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Channel" />
                        </SelectTrigger>
                        <SelectContent>
                            {channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50 text-slate-500 text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-6 py-4 font-semibold">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                    <TableRow>
                        <TableCell colSpan={columns.length}>
                            <RenderSubComponent row={row as Row<Lead>} onUpdateNotes={onUpdateNotes} />
                        </TableCell>
                    </TableRow>
                )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No leads found.
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
