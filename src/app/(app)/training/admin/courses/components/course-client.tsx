'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Course } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, type SortingState } from '@tanstack/react-table';
import { getColumns } from './columns';
import { CourseDataTable } from './data-table';
import { useRouter } from 'next/navigation';

interface CourseClientProps {
  initialCourses: Course[];
  loading: boolean;
  onSetDefault: (course: Course) => void;
}

export function CourseClient({ initialCourses, loading, onSetDefault }: CourseClientProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const handleTogglePublish = async (course: Course) => {
    if (!firestore) return;
    const courseRef = doc(firestore, 'courses', course.id);
    const newStatus = !course.published;
    try {
      await updateDoc(courseRef, { published: newStatus });
      toast({
        title: 'Status Updated',
        description: `Course has been ${newStatus ? 'published' : 'set to draft'}.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update course status.', variant: 'destructive' });
    }
  };
  
  const handleDeleteCourse = useCallback(async (courseId: string) => {
    if (!firestore) return;
    const courseRef = doc(firestore, 'courses', courseId);
    try {
        await deleteDoc(courseRef);
        toast({
            title: 'Course Deleted',
            description: 'The course has been successfully removed.',
        });
    } catch (error) {
         toast({ title: 'Error', description: 'Could not delete the course.', variant: 'destructive' });
    }
  }, [firestore, toast]);
  
  const handleEditCourse = (course: Course) => {
    router.push(`/training/admin/courses/edit/${course.id}`);
  }


  const columns = useMemo(() => getColumns({ onEdit: handleEditCourse, onTogglePublish: handleTogglePublish, onDelete: handleDeleteCourse, onSetDefault }), [onSetDefault, handleDeleteCourse, handleEditCourse]);

  const table = useReactTable({
    data: initialCourses,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  return (
      <CourseDataTable
        table={table}
        columns={columns}
        loading={loading}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
  );
}
