'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { type Course } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { CourseBuilderClient } from './components/course-builder-client';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CourseBuilderPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const firestore = useFirestore();

  const courseDocRef = useMemo(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );

  const { data: course, loading: courseLoading } = useDoc<Course>(courseDocRef);

  if (courseLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold">Course not found</h2>
        <p className="text-muted-foreground">This course may have been deleted.</p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/training/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <CourseBuilderClient course={course} />
  );
}
