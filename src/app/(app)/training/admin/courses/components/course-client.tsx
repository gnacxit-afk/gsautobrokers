'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Course, Module, Lesson } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, type SortingState } from '@tanstack/react-table';
import { getColumns } from './columns';
import { CourseDataTable } from './data-table';
import { CourseDialog } from './course-dialog';

interface CourseClientProps {
  initialCourses: Course[];
  moduleCounts: Map<string, number>;
  lessonCounts: Map<string, number>;
  loading: boolean;
  onSetDefault: (course: Course) => void;
}

export function CourseClient({ initialCourses, moduleCounts, lessonCounts, loading, onSetDefault }: CourseClientProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleOpenDialog = (course?: Course) => {
    setEditingCourse(course || null);
    setIsDialogOpen(true);
  };

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


  const columns = useMemo(() => getColumns({ onEdit: handleOpenDialog, onTogglePublish: handleTogglePublish, onDelete: handleDeleteCourse, onSetDefault, moduleCounts, lessonCounts }), [onSetDefault, moduleCounts, lessonCounts, handleDeleteCourse]);

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
  
  const handleSaveCourse = async (courseData: Pick<Course, 'title' | 'description' | 'passingScore' | 'thumbnailUrl'>) => {
     if (!firestore || !user) return;
     
     try {
        if (editingCourse) {
            // Update existing course
            const courseRef = doc(firestore, 'courses', editingCourse.id);
            await updateDoc(courseRef, courseData);
            toast({ title: 'Course Updated', description: `"${courseData.title}" has been saved.` });
        } else {
            // Create new course
            const coursesCollection = collection(firestore, 'courses');
            await addDoc(coursesCollection, {
                ...courseData,
                authorId: user.id,
                published: false, // Always start as draft
                isDefaultOnboarding: false,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Course Created', description: 'Your new course has been saved as a draft.' });
        }
        setIsDialogOpen(false);
        setEditingCourse(null);
     } catch (error) {
        toast({ title: 'Save Failed', description: 'Could not save the course details.', variant: 'destructive' });
     }
  };


  return (
    <>
      <CourseDataTable
        table={table}
        columns={columns}
        loading={loading}
        onOpenNewCourseDialog={() => handleOpenDialog()}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
      <CourseDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        initialData={editingCourse}
      />
    </>
  );
}
