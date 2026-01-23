'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import type { Course, Module, Lesson } from '@/lib/types';
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

  const modulesQuery = useMemo(() => firestore ? collection(firestore, 'modules') : null, [firestore]);
  const { data: modules, loading: modulesLoading } = useCollection<Module>(modulesQuery);

  const lessonsQuery = useMemo(() => firestore ? collection(firestore, 'lessons') : null, [firestore]);
  const { data: lessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  const moduleCounts = useMemo(() => {
    if (!modules) return new Map<string, number>();
    return modules.reduce((acc, module) => {
      acc.set(module.courseId, (acc.get(module.courseId) || 0) + 1);
      return acc;
    }, new Map<string, number>());
  }, [modules]);
  
  const lessonCounts = useMemo(() => {
    if (!lessons) return new Map<string, number>();
    return lessons.reduce((acc, lesson) => {
      acc.set(lesson.courseId, (acc.get(lesson.courseId) || 0) + 1);
      return acc;
    }, new Map<string, number>());
  }, [lessons]);

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

  const loading = userLoading || coursesLoading || modulesLoading || lessonsLoading;

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
        moduleCounts={moduleCounts}
        lessonCounts={lessonCounts}
        loading={loading}
        onSetDefault={handleSetDefaultCourse}
      />
    </main>
  );
}
