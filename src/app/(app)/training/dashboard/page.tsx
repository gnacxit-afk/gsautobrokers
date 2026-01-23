'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, setDoc, arrayUnion, getDoc, updateDoc } from 'firebase/firestore';
import type { Course, UserProgress, Certificate, Lesson } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

function CertificateCard({ certificate, course }: { certificate: Certificate, course?: Course }) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-yellow-500" />
                <div>
                    <p className="font-semibold">{course?.title || 'Completed Course'}</p>
                    <p className="text-xs text-muted-foreground">Issued on: {format(certificate.issuedAt.toDate(), 'MMM d, yyyy')}</p>
                </div>
            </div>
            <Button asChild size="sm" variant="outline">
                <Link href={`/training/certificate/${certificate.id}`} target="_blank">View</Link>
            </Button>
        </div>
    )
}

function CourseCard({ course, progress, allLessons }: { course: Course; progress?: UserProgress | null, allLessons: Lesson[] }) {
    const router = useRouter();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const courseLessons = useMemo(() => allLessons.filter(l => l.courseId === course.id), [allLessons, course.id]);
    const totalLessons = courseLessons.length;
    const completedLessons = progress ? Object.values(progress.lessonProgress || {}).filter(p => p.completed).length : 0;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    const handleStartCourse = async () => {
        if (!firestore || !user) return;

        try {
            const progressRef = doc(firestore, 'userProgress', `${user.id}_${course.id}`);
            const progressSnap = await getDoc(progressRef);
            
            if (!progressSnap.exists()) {
                await setDoc(progressRef, {
                    userId: user.id,
                    courseId: course.id,
                    completed: false,
                    lessonProgress: {},
                    quizScores: {},
                });
            }

            const userRef = doc(firestore, 'staff', user.id);
            await updateDoc(userRef, {
                enrolledCourses: arrayUnion(course.id)
            });

            toast({ title: "Course Started!", description: `You are now enrolled in "${course.title}".` });
            router.push(`/training/course/${course.id}`);

        } catch (error) {
            toast({ title: "Error", description: "Could not start the course.", variant: "destructive" });
        }
    };


    return (
        <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
            <Link href={`/training/course/${course.id}`} className="block">
                <div className="relative aspect-video bg-slate-100">
                    {course.thumbnailUrl ? (
                        <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                    ) : (
                         <div className="flex items-center justify-center h-full text-slate-400 bg-slate-200">
                            <BookOpen size={32} />
                        </div>
                    )}
                </div>
            </Link>
            <CardHeader>
                <CardTitle className="line-clamp-2 h-14">{course.title}</CardTitle>
                <CardDescription className="line-clamp-3 h-[60px]">{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 {progress && (
                    <div className="space-y-2">
                        <Progress value={progressPercentage} />
                        <p className="text-xs text-muted-foreground">{completedLessons} of {totalLessons} lessons completed</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {progress ? (
                     <Button asChild className="w-full">
                        <Link href={`/training/course/${course.id}`}>Continue Learning</Link>
                    </Button>
                ) : (
                    <Button onClick={handleStartCourse} className="w-full">Start Course</Button>
                )}
            </CardFooter>
        </Card>
    )
}

export default function TrainingDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();

  // Query for all published courses
  const coursesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'courses'), where('published', '==', true), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: courses, loading: coursesLoading } = useCollection<Course>(coursesQuery);

  // Query for all lessons to calculate progress
  const lessonsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'lessons'));
  }, [firestore]);
  const { data: allLessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  // Query for the user's progress
  const progressQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'userProgress'), where('userId', '==', user.id));
  }, [firestore, user]);
  const { data: userProgress, loading: progressLoading } = useCollection<UserProgress>(progressQuery);

  // Query for the user's certificates
  const certificatesQuery = useMemo(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'certificates'), where('userId', '==', user.id));
  }, [firestore, user]);
  const { data: certificates, loading: certificatesLoading } = useCollection<Certificate>(certificatesQuery);
  

  const loading = userLoading || coursesLoading || progressLoading || certificatesLoading || lessonsLoading;
  
  const { enrolledCourses, availableCourses } = useMemo(() => {
      if (!courses || !userProgress) return { enrolledCourses: [], availableCourses: [] };

      const progressMap = new Map(userProgress.map(p => [p.courseId, p]));
      
      const enrolled: {course: Course, progress: UserProgress}[] = [];
      const available: Course[] = [];

      courses.forEach(course => {
          if (progressMap.has(course.id)) {
              enrolled.push({ course, progress: progressMap.get(course.id)! });
          } else {
              available.push(course);
          }
      });
      return { enrolledCourses: enrolled, availableCourses: available };

  }, [courses, userProgress]);
  
  const coursesById = useMemo(() => new Map(courses?.map(c => [c.id, c])), [courses]);


  return (
    <main>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Learning Dashboard</h1>
        <p className="text-muted-foreground">Your enrolled courses and progress at a glance.</p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-4">My Courses</h2>
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map(({ course, progress }) => (
                <CourseCard key={course.id} course={course} progress={progress} allLessons={allLessons || []} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You are not enrolled in any courses yet. Browse the available courses below.</p>
          )}
        </section>
        
        {certificates && certificates.length > 0 && (
            <section>
                <h2 className="text-xl font-semibold mb-4">My Certificates</h2>
                <div className="space-y-3">
                    {certificates.map(cert => (
                        <CertificateCard key={cert.id} certificate={cert} course={coursesById.get(cert.courseId)} />
                    ))}
                </div>
            </section>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-4">Available Courses</h2>
           {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
          ) : availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map(course => (
                <CourseCard key={course.id} course={course} allLessons={allLessons || []} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No new courses available at this time.</p>
          )}
        </section>
      </div>
    </main>
  );
}
