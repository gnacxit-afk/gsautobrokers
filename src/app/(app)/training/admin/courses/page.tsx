'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { AccessDenied } from '@/components/access-denied';
import { CourseClient } from './components/course-client';

export default function CourseManagementPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: courses, loading: coursesLoading } = useCollection<Course>(coursesQuery);

  if (userLoading) {
    return <div>Loading...</div>;
  }

  if (user?.role !== 'Admin' && user?.role !== 'Supervisor') {
    return <AccessDenied />;
  }

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Management</h1>
        <p className="text-muted-foreground">
          Create, edit, and manage all courses in the LMS.
        </p>
      </div>
      <CourseClient
        initialCourses={courses || []}
        loading={coursesLoading}
      />
    </main>
  );
}
