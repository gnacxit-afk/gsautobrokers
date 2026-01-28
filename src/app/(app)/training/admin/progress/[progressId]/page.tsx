
'use client';

import { useParams, useRouter } from "next/navigation";
import { useMemo } from 'react';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Course, Module, Lesson, UserProgress, Staff } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, Circle, Clock, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";

const DetailCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: React.ReactNode }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <Icon className="h-5 w-5 text-slate-500" />
        <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-sm font-semibold">{value}</p>
        </div>
    </div>
);

export default function ProgressDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const progressId = params.progressId as string;
    const firestore = useFirestore();

    const progressRef = useMemo(() => firestore ? doc(firestore, 'userProgress', progressId) : null, [firestore, progressId]);
    const { data: progress, loading: progressLoading } = useDoc<UserProgress>(progressRef);
    
    const userRef = useMemo(() => firestore && progress?.userId ? doc(firestore, 'staff', progress.userId) : null, [firestore, progress]);
    const { data: user, loading: userLoading } = useDoc<Staff>(userRef);

    const courseRef = useMemo(() => firestore && progress?.courseId ? doc(firestore, 'courses', progress.courseId) : null, [firestore, progress]);
    const { data: course, loading: courseLoading } = useDoc<Course>(courseRef);

    const lessonsQuery = useMemo(() => firestore && progress?.courseId ? query(collection(firestore, 'lessons'), where('courseId', '==', progress.courseId), orderBy('order')) : null, [firestore, progress]);
    const { data: lessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

    const { progressPercentage, completedLessons, totalLessons } = useMemo(() => {
        if (!lessons || !progress) return { progressPercentage: 0, completedLessons: 0, totalLessons: 0 };
        const total = lessons.length;
        const completed = Object.values(progress.lessonProgress || {}).filter(p => p.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { progressPercentage: percentage, completedLessons: completed, totalLessons: total };
    }, [lessons, progress]);

    const loading = progressLoading || userLoading || courseLoading || lessonsLoading;
    
    if (loading) {
        return (
             <main className="flex-1 space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                     <div className="md:col-span-2 space-y-4">
                         <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </main>
        )
    }

    if (!progress || !user || !course) {
        return <p>Progress record not found.</p>
    }

    return (
        <main className="flex-1 space-y-6">
            <div>
                 <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Progress List
                </Button>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Progress Details: <span className="text-primary">{user.name}</span></CardTitle>
                    <CardDescription>
                        Detailed view of progress for the course: "{course.title}"
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-4">
                            <h4 className="text-sm font-bold text-muted-foreground">SUMMARY</h4>
                            <DetailCard icon={Percent} title="Overall Progress" value={`${progressPercentage}%`} />
                            <DetailCard icon={BookOpen} title="Lessons Completed" value={`${completedLessons} / ${totalLessons}`} />
                            <Separator />
                            <h4 className="text-sm font-bold text-muted-foreground">QUIZ SCORES</h4>
                            {Object.keys(progress.quizScores || {}).length > 0 ? (
                                Object.entries(progress.quizScores).map(([quizId, score]) => (
                                    <DetailCard key={quizId} icon={Percent} title={`Quiz ${quizId.substring(0, 5)}...`} value={`${score}%`} />
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center p-4 bg-slate-50 rounded-md">No quiz scores recorded yet.</p>
                            )}
                        </div>
                        <div className="md:col-span-2 overflow-hidden flex flex-col">
                            <h4 className="text-sm font-bold text-muted-foreground mb-4">LESSON PROGRESS</h4>
                            <div className="space-y-3">
                                {lessons?.map(lesson => {
                                    const lessonProgress = progress.lessonProgress?.[lesson.id];
                                    const isCompleted = lessonProgress?.completed;
                                    const watchedTime = lessonProgress?.watchedSeconds ? Math.round(lessonProgress.watchedSeconds / 60) : 0;

                                    return (
                                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-md border bg-white">
                                            <div className="flex items-center gap-3">
                                                {isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-slate-300" />}
                                                <p className={cn("text-sm", { "text-muted-foreground": isCompleted })}>{lesson.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock size={14}/>
                                                <span>{watchedTime} / {lesson.duration} min</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    )
}
