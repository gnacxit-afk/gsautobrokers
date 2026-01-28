
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { UserProgress, Staff, Course, Lesson } from '@/lib/types';
import { AccessDenied } from '@/components/access-denied';
import { ProgressClient } from './components/progress-client';

export default function UserProgressPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  const progressQuery = useMemo(() => firestore ? query(collection(firestore, 'userProgress'), orderBy('userId')) : null, [firestore]);
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const coursesQuery = useMemo(() => firestore ? collection(firestore, 'courses') : null, [firestore]);
  const lessonsQuery = useMemo(() => firestore ? collection(firestore, 'lessons') : null, [firestore]);

  const { data: allProgress, loading: progressLoading } = useCollection<UserProgress>(progressQuery);
  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: allCourses, loading: coursesLoading } = useCollection<Course>(coursesQuery);
  const { data: allLessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  const loading = userLoading || progressLoading || staffLoading || coursesLoading || lessonsLoading;

  if (userLoading) {
    return <div>Loading...</div>;
  }

  if (user?.role !== 'Admin' && user?.role !== 'Supervisor') {
    return <AccessDenied />;
  }

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Progress</h1>
        <p className="text-muted-foreground">Monitor the learning progress of all users across all courses.</p>
      </div>
      <ProgressClient
        allProgress={allProgress || []}
        allStaff={allStaff || []}
        allCourses={allCourses || []}
        allLessons={allLessons || []}
        loading={loading}
      />
    </main>
  );
}
