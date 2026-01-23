'use client';

import { useState, useMemo, useCallback } from 'react';
import type { UserProgress, Staff, Course, Lesson } from '@/lib/types';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, type SortingState } from '@tanstack/react-table';
import { getColumns, type ProgressRow } from './columns';
import { ProgressDataTable } from './data-table';
import { useRouter } from 'next/navigation';

interface ProgressClientProps {
  allProgress: UserProgress[];
  allStaff: Staff[];
  allCourses: Course[];
  allLessons: Lesson[];
  loading: boolean;
}

export function ProgressClient({ allProgress, allStaff, allCourses, allLessons, loading }: ProgressClientProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();

  const tableData = useMemo<ProgressRow[]>(() => {
    if (loading) return [];

    const staffMap = new Map(allStaff.map(s => [s.id, s]));
    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    const lessonsByCourse = allLessons.reduce((acc, lesson) => {
      if (!acc[lesson.courseId]) {
        acc[lesson.courseId] = [];
      }
      acc[lesson.courseId].push(lesson);
      return acc;
    }, {} as Record<string, Lesson[]>);

    return allProgress.reduce((acc, progress) => {
      const user = staffMap.get(progress.userId);
      const course = courseMap.get(progress.courseId);

      // If the user or course associated with the progress record doesn't exist, skip it.
      if (!user || !course) {
        return acc;
      }

      const courseLessons = lessonsByCourse[progress.courseId] || [];
      const totalLessons = courseLessons.length;
      
      const completedLessons = Object.values(progress.lessonProgress || {}).filter(p => p.completed).length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      acc.push({
        id: progress.id,
        user: user,
        course: course,
        progressPercentage,
        completedLessons,
        totalLessons,
        isCompleted: progress.completed,
        rawProgress: progress,
      });
      
      return acc;
    }, [] as ProgressRow[]);
  }, [allProgress, allStaff, allCourses, allLessons, loading]);

  const handleViewDetails = useCallback((row: ProgressRow) => {
    router.push(`/training/admin/progress/${row.id}`);
  }, [router]);
  
  const columns = useMemo(() => getColumns({ onViewDetails: handleViewDetails }), [handleViewDetails]);

  const table = useReactTable({
    data: tableData,
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
    <>
      <ProgressDataTable
        table={table}
        loading={loading}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
      />
    </>
  );
}
