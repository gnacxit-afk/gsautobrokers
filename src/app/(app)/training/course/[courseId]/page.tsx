
'use client';

import { useParams } from "next/navigation";
import { useMemo } from 'react';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Course, Module, Lesson, UserProgress } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, CheckCircle, Circle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


function CourseContent({ course, modules, lessons, progress }: { course: Course, modules: Module[], lessons: Lesson[], progress: UserProgress | null }) {
    
    const totalLessons = lessons.length;
    const completedLessons = progress ? Object.values(progress.lessonProgress || {}).filter(p => p.completed).length : 0;
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100">
                    {course.thumbnailUrl ? (
                        <Image src={course.thumbnailUrl} alt={course.title} fill className="object-cover" />
                    ) : (
                         <div className="flex items-center justify-center h-full text-slate-400">
                            <BookOpen size={64} />
                        </div>
                    )}
                </div>
                <h1 className="text-3xl font-extrabold">{course.title}</h1>
                <p className="text-muted-foreground">{course.description}</p>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Course Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <Progress value={progressPercentage} />
                         <p className="text-sm text-center text-muted-foreground">{completedLessons} of {totalLessons} lessons completed</p>
                    </CardContent>
                </Card>
                <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="w-full">
                    {modules.map((module) => {
                        const moduleLessons = lessons.filter(l => l.moduleId === module.id);
                        return (
                             <AccordionItem value={module.id} key={module.id}>
                                <AccordionTrigger className="font-semibold">{module.title}</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="space-y-2">
                                        {moduleLessons.map(lesson => {
                                            const isCompleted = progress?.lessonProgress?.[lesson.id]?.completed;
                                            return (
                                                <li key={lesson.id}>
                                                    <Link href={`/training/lesson/${lesson.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                                         <div className="flex items-center gap-3">
                                                            {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-slate-300" />}
                                                            <span className={cn("text-sm", { "text-muted-foreground": isCompleted })}>{lesson.title}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        </div>
    )
}

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const courseRef = useMemo(() => firestore ? doc(firestore, 'courses', courseId) : null, [firestore, courseId]);
  const { data: course, loading: courseLoading } = useDoc<Course>(courseRef);
  
  const modulesQuery = useMemo(() => firestore ? query(collection(firestore, 'modules'), where('courseId', '==', courseId), orderBy('order')) : null, [firestore, courseId]);
  const { data: modules, loading: modulesLoading } = useCollection<Module>(modulesQuery);
  
  const lessonsQuery = useMemo(() => firestore ? query(collection(firestore, 'lessons'), where('courseId', '==', courseId), orderBy('order')) : null, [firestore, courseId]);
  const { data: lessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  
  const progressRef = useMemo(() => firestore && user ? doc(firestore, 'userProgress', `${user.id}_${courseId}`) : null, [firestore, user, courseId]);
  const { data: progress, loading: progressLoading } = useDoc<UserProgress>(progressRef);

  const loading = courseLoading || modulesLoading || lessonsLoading || progressLoading;

  return (
    <main>
        <div className="mb-6">
             <Button asChild variant="outline" size="sm">
                <Link href="/training/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Link>
            </Button>
        </div>
        
        {loading ? (
             <div className="space-y-6">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        ) : course && modules && lessons ? (
            <CourseContent course={course} modules={modules} lessons={lessons} progress={progress} />
        ) : (
            <p>Course not found.</p>
        )}
    </main>
  );
}
