
'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { PlusCircle, Search, X, Filter, Users } from 'lucide-react';
import type { Lead, Staff } from '@/lib/types';
import { AddLeadDialog } from './add-lead-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/layout/date-range-picker';
import { useUser } from '@/firebase';
import { parseSearch } from '../page'; // Import from parent
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const leadChannels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

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

  const { keywords: activeFilters, text: freeText } = parseSearch(globalFilter);

  const handleSetFilter = (key: string, value: string) => {
    const newKeywords = { ...activeFilters, [key]: value };
    const newFilterString = Object.entries(newKeywords)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ') + ' ' + freeText.join(' ');
    setGlobalFilter(newFilterString.trim());
  };

  const handleRemoveFilter = (keyToRemove: string) => {
    const newKeywords = { ...activeFilters };
    delete newKeywords[keyToRemove];
    const newFilterString = Object.entries(newKeywords)
      .map(([k, v]) => `${k}:${v}`)
      .join(' ') + ' ' + freeText.join(' ');
    setGlobalFilter(newFilterString.trim());
  };
  
  const handleFreeTextChange = (newText: string) => {
    const keywordString = Object.entries(activeFilters)
        .map(([k,v]) => `${k}:${v}`)
        .join(' ');
    setGlobalFilter((keywordString + ' ' + newText).trim());
  }

  const getOwnerNameById = (ownerId: string) => {
    return staff.find(s => s.id === ownerId)?.name || ownerId;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="w-full md:max-w-md space-y-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, phone, email..."
                    value={freeText.join(' ')}
                    onChange={event => handleFreeTextChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            {Object.keys(activeFilters).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(activeFilters).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="capitalize text-xs">
                            <span className="font-semibold mr-1">{key}:</span> {key === 'ownerid' ? getOwnerNameById(value) : value}
                            <button onClick={() => handleRemoveFilter(key)} className="ml-2 rounded-full hover:bg-black/10 p-0.5">
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
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Stage</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeFilters.stage} onValueChange={(v) => handleSetFilter('stage', v)}>
                  {leadStages.map(stage => (
                    <DropdownMenuRadioItem key={stage} value={stage}>{stage}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Channel</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Channel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeFilters.channel} onValueChange={(v) => handleSetFilter('channel', v)}>
                  {leadChannels.map(c => (
                    <DropdownMenuRadioItem key={c} value={c}>{c}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" /> Owner</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Owner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeFilters.ownerid} onValueChange={(v) => handleSetFilter('ownerid', v)}>
                  {staff.map(s => (
                    <DropdownMenuRadioItem key={s.id} value={s.id}>{s.name}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DateRangePicker />
            <Button onClick={handleOpenAddLeadDialog} className="w-full sm:w-auto">
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
