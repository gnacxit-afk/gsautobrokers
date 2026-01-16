
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
import { PlusCircle, Search, X, Filter, Users, Tag, Share2 } from 'lucide-react';
import type { Lead, Staff } from '@/lib/types';
import { AddLeadDialog } from './add-lead-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/layout/date-range-picker';
import { useUser } from '@/firebase';
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

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const leadChannels: Lead['channel'][] = ['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other'];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  table: Table<TData>;
  onAddLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'> & { initialNotes?: string }, callback?: (lead: Lead) => void) => void;
  staff: Staff[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  activeFilters: {key: string; value: string}[];
  setActiveFilters: React.Dispatch<React.SetStateAction<{key: string; value: string}[]>>;
}

export function DataTable<TData, TValue>({
  columns,
  table,
  onAddLead,
  staff,
  loading,
  searchTerm,
  setSearchTerm,
  activeFilters,
  setActiveFilters
}: DataTableProps<TData, TValue>) {
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const { user } = useUser();

  const handleOpenAddLeadDialog = useCallback(() => {
    setIsAddLeadOpen(true);
  }, []);

  const assignableStaff = useMemo(() => {
    if (!user || !staff) return [];
    if (user.role === 'Admin' || user.role === 'Supervisor') {
      return staff.filter(s => ['Admin', 'Supervisor', 'Broker'].includes(s.role));
    }
    return staff.filter(s => s.id === user.id);
  }, [user, staff]);
  
  const defaultOwnerId = useMemo(() => {
      if (user?.role === 'Broker') return user.id;
      return assignableStaff.length > 0 ? assignableStaff[0].id : '';
  }, [user, assignableStaff]);

  const addFilter = (key: string, value: string) => {
    // Remove existing filter of the same key before adding new one
    const otherFilters = activeFilters.filter(f => f.key !== key);
    setActiveFilters([...otherFilters, { key, value }]);
    setSearchTerm('');
    setShowAutocomplete(false);
  };

  const removeFilter = (key: string, value: string) => {
    setActiveFilters(activeFilters.filter(f => !(f.key === key && f.value === value)));
  };

  const getOwnerNameById = (ownerId: string) => {
    return staff.find(s => s.id === ownerId)?.name || ownerId;
  }

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
                    placeholder="Search by name, phone, email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowAutocomplete(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowAutocomplete(searchTerm.length > 0)}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 150)}
                    className="pl-10"
                />
            </div>
             {activeFilters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                    {activeFilters.map((f, i) => (
                        <Badge key={`${f.key}-${i}`} variant="secondary" className="capitalize text-xs">
                            <span className="font-semibold mr-1">{f.key === 'ownerId' ? 'owner' : f.key}:</span> {f.key === 'ownerId' ? getOwnerNameById(f.value) : f.value}
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
                <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Stage</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeFilters.find(f => f.key === 'stage')?.value} onValueChange={(v) => addFilter('stage', v)}>
                  {leadStages.map(stage => (
                    <DropdownMenuRadioItem key={stage} value={stage}>{stage}</DropdownMenuRadioItem>
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
                <DropdownMenuRadioGroup value={activeFilters.find(f => f.key === 'ownerId')?.value} onValueChange={(v) => addFilter('ownerId', v)}>
                  {staff.map(s => (
                    <DropdownMenuRadioItem key={s.id} value={s.id}>{s.name}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Share2 className="mr-2 h-4 w-4" /> Channel</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Channel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeFilters.find(f => f.key === 'channel')?.value} onValueChange={(v) => addFilter('channel', v)}>
                  {leadChannels.map(channel => (
                    <DropdownMenuRadioItem key={channel} value={channel}>{channel}</DropdownMenuRadioItem>
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
                  No results found for the current filters.
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
