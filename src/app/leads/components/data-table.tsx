"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  getFilteredRowModel,
  Table as ReactTable,
  getExpandedRowModel,
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
import { Plus, Search } from "lucide-react";
import { NewLeadDialog } from "./new-lead-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@/lib/types";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  table: ReactTable<TData>;
  onUpdateNotes: (id: string, notes: string) => void;
}

const renderSubComponent = ({ row, onUpdateNotes }: { row: Row<Lead>, onUpdateNotes: (id: string, notes: string) => void }) => {
    const { toast } = useToast();
    const [notes, setNotes] = React.useState(row.original.notes || "");

    const handleSaveNotes = () => {
        onUpdateNotes(row.original.id, notes);
        toast({ title: "Notes Updated", description: "The notes for this lead have been saved." });
    }

    return (
        <Card className="m-4 bg-slate-50">
            <CardContent className="p-4">
                <div className="space-y-2">
                    <Label htmlFor={`notes-${row.id}`} className="font-semibold">Lead Notes</Label>
                    <Textarea 
                        id={`notes-${row.id}`} 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes for this lead..."
                        className="h-24"
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export function DataTable<TData extends Lead, TValue>({
  columns,
  data,
  table,
  onUpdateNotes,
}: DataTableProps<TData, TValue>) {
  
  const [isNewLeadDialogOpen, setNewLeadDialogOpen] = React.useState(false);
  const globalFilter = table.getState().globalFilter;
  const setGlobalFilter = (filter: string) => table.setGlobalFilter(filter);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                    placeholder="Search by name or company..."
                    value={globalFilter ?? ''}
                    onChange={event => setGlobalFilter(event.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <NewLeadDialog open={isNewLeadDialogOpen} onOpenChange={setNewLeadDialogOpen}>
                <Button 
                    onClick={() => setNewLeadDialogOpen(true)}
                    className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} /> Add Lead
                </Button>
            </NewLeadDialog>
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
                            {renderSubComponent({ row: row as Row<Lead>, onUpdateNotes })}
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
