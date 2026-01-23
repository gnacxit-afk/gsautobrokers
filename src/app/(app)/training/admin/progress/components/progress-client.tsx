'use client';

import { useState, useMemo } from 'react';
import type { UserProgress, Staff, Course, Lesson } from '@/lib/types';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, type SortingState } from '@tanstack/react-table';
import { getColumns, type ProgressRow } from './columns';
import { ProgressDataTable } from './data-table';
import { ProgressDetailsDialog } from './progress-details-dialog';

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
  const [selectedProgress, setSelectedProgress] = useState<ProgressRow | null>(null);

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

    return allProgress.map(progress => {
      const user = staffMap.get(progress.userId);
      const course = courseMap.get(progress.courseId);
      const courseLessons = lessonsByCourse[progress.courseId] || [];
      const totalLessons = courseLessons.length;
      
      const completedLessons = Object.values(progress.lessonProgress || {}).filter(p => p.completed).length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: progress.id,
        user: user || { id: progress.userId, name: 'Unknown User' },
        course: course || { id: progress.courseId, title: 'Unknown Course' },
        progressPercentage,
        completedLessons,
        totalLessons,
        isCompleted: progress.completed,
        rawProgress: progress,
      };
    });
  }, [allProgress, allStaff, allCourses, allLessons, loading]);

  const handleViewDetails = (row: ProgressRow) => {
    setSelectedProgress(row);
  };
  
  const columns = useMemo(() => getColumns({ onViewDetails: handleViewDetails }), []);

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
      <ProgressDetailsDialog
        isOpen={!!selectedProgress}
        onClose={() => setSelectedProgress(null)}
        progressData={selectedProgress}
        allLessons={allLessons.filter(l => l.courseId === selectedProgress?.course.id)}
      />
    </>
  );
}
