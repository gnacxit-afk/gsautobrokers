'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { CourseForm } from '../../components/course-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const firestore = useFirestore();

  const courseRef = useMemo(() => firestore && courseId ? doc(firestore, 'courses', courseId) : null, [firestore, courseId]);
  const { data: course, loading } = useDoc<Course>(courseRef);

  if (loading) {
    return (
        <main className="flex-1 space-y-6">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-96 w-full" />
        </main>
    )
  }

  if (!course) {
    return <p>Course not found.</p>;
  }

  return (
    <main className="flex-1">
      <CourseForm initialData={course} />
    </main>
  );
}
