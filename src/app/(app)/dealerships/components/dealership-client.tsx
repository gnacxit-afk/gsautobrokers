
'use client';

import { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, getSortedRowModel, type SortingState } from '@tanstack/react-table';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { getColumns } from './columns';
import type { Dealership } from '@/lib/types';
import { DealershipDataTable } from './data-table';
import { DealershipDialog } from './dealership-dialog';

interface DealershipClientProps {
  initialDealerships: Dealership[];
}

export function DealershipClient({ initialDealerships }: DealershipClientProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDealership, setEditingDealership] = useState<Dealership | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');


  const handleOpenDialog = (dealership?: Dealership) => {
    setEditingDealership(dealership || null);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (dealershipId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'dealerships', dealershipId));
      toast({ title: 'Dealership Deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete dealership.', variant: 'destructive' });
    }
  };
  
  const columns = useMemo(() => getColumns({ onEdit: handleOpenDialog, onDelete: handleDelete }), []);

  const table = useReactTable({
    data: initialDealerships,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleSave = async (data: Omit<Dealership, 'id' | 'createdAt'>) => {
    if (!firestore) return;
    try {
      if (editingDealership) {
        const dealershipRef = doc(firestore, 'dealerships', editingDealership.id);
        await updateDoc(dealershipRef, data);
        toast({ title: 'Dealership Updated' });
      } else {
        await addDoc(collection(firestore, 'dealerships'), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Dealership Added' });
      }
      setIsDialogOpen(false);
      setEditingDealership(null);
    } catch (error) {
      toast({ title: 'Save Failed', description: 'Could not save dealership details.', variant: 'destructive' });
    }
  };


  return (
    <>
      <DealershipDataTable 
        table={table} 
        columns={columns} 
        onOpenNewDialog={() => handleOpenDialog()}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <DealershipDialog 
        isOpen={isDialogOpen} 
        onClose={() => { setIsDialogOpen(false); setEditingDealership(null); }} 
        onSave={handleSave} 
        initialData={editingDealership} 
      />
    </>
  );
}

    