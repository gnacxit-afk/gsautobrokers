
'use client';

import { useMemo, useState, useCallback } from 'react';
import { getColumns } from './columns';
import { useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { flexRender } from '@tanstack/react-table';
import type { Candidate } from '@/lib/types';
import { CandidateDetailsDialog } from './candidate-details-dialog';
import { NewStaffDialog } from '@/app/(app)/staff/components/new-staff-dialog';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface CandidateTableProps {
  title: string;
  description: string;
  candidates: Candidate[];
  isLoading: boolean;
}

export function CandidateTable({ title, description, candidates, isLoading }: CandidateTableProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateToConvert, setCandidateToConvert] = useState<Candidate | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };
  
  const handleCreateStaff = (candidate: Candidate) => {
    setCandidateToConvert(candidate);
  };

  const onStaffCreated = async (candidateId: string) => {
    if (!firestore) return;
    try {
        const candidateRef = doc(firestore, 'candidates', candidateId);
        await updateDoc(candidateRef, {
            pipelineStatus: 'Active',
            lastStatusChangeDate: serverTimestamp(),
        });
        toast({ title: "Candidate Activated", description: "The candidate is now an active staff member."});
    } catch (error) {
        console.error("Error activating candidate:", error);
        toast({ title: "Activation Failed", description: "Could not update the candidate's status to Active.", variant: 'destructive'});
    }
  };

  const handleDeleteCandidate = useCallback(async (candidate: Candidate) => {
    if (!firestore || !candidate) return;
    try {
      const candidateRef = doc(firestore, 'candidates', candidate.id);
      await deleteDoc(candidateRef);
      toast({ title: 'Candidate Deleted', description: `${candidate.fullName} has been removed from the database.` });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast({ title: 'Deletion Failed', description: 'Could not delete the candidate.', variant: 'destructive' });
    }
  }, [firestore, toast]);

  const columns = useMemo(() => getColumns(handleViewDetails, handleCreateStaff, handleDeleteCandidate), [handleDeleteCandidate]);

  const table = useReactTable({
    data: candidates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
                      No candidates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <CandidateDetailsDialog
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedCandidate(null);
          }
        }}
      />
      <NewStaffDialog 
        isOpen={!!candidateToConvert}
        onOpenChange={(isOpen) => !isOpen && setCandidateToConvert(null)}
        candidate={candidateToConvert}
        onStaffCreated={onStaffCreated}
      />
    </>
  );
}
