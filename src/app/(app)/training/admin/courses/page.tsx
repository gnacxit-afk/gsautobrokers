
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import type { Course } from '@/lib/types';
import { AccessDenied } from '@/components/access-denied';
import { CourseClient } from './components/course-client';
import { useToast } from '@/hooks/use-toast';

export default function CourseManagementPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: courses, loading: coursesLoading } = useCollection<Course>(coursesQuery);

  const handleSetDefaultCourse = async (courseToSet: Course) => {
    if (!firestore || !courses) return;

    const batch = writeBatch(firestore);

    const currentDefault = courses.find(c => c.isDefaultOnboarding);
    if (currentDefault) {
      const currentDefaultRef = doc(firestore, 'courses', currentDefault.id);
      batch.update(currentDefaultRef, { isDefaultOnboarding: false });
    }

    const newDefaultRef = doc(firestore, 'courses', courseToSet.id);
    batch.update(newDefaultRef, { isDefaultOnboarding: true });

    try {
      await batch.commit();
      toast({
        title: 'Default Course Updated',
        description: `"${courseToSet.title}" is now the default onboarding course.`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not set the default course.', variant: 'destructive' });
    }
  };

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
        onSetDefault={handleSetDefaultCourse}
      />
    </main>
  );
}

