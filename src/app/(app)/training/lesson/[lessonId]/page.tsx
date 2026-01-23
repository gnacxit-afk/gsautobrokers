'use client';

import { useParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useRef, useState } from 'react';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { doc, updateDoc, serverTimestamp, setDoc, getDoc, collection, query, where, getDocs, addDoc, arrayUnion } from 'firebase/firestore';
import type { Lesson, Quiz, UserProgress, Course } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReactPlayer from 'react-player/vimeo';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";

function QuizModal({ quiz, isOpen, onSubmit }: { quiz: Quiz; isOpen: boolean; onSubmit: (isCorrect: boolean, score: number) => void }) {
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | number[]>>({});

    const handleSubmit = () => {
        let correctCount = 0;
        quiz.questions.forEach((q, qIndex) => {
            if (q.type === 'single') {
                if (selectedAnswers[qIndex] === q.correctIndex) {
                    correctCount++;
                }
            } else if (q.type === 'multiple') {
                const userAnswers = selectedAnswers[qIndex] as number[] || [];
                const correctAnswers = q.correctIndices || [];
                if (userAnswers.length === correctAnswers.length && userAnswers.every(a => correctAnswers.includes(a))) {
                    correctCount++;
                }
            } else {
                // Assume open answers are correct for now
                correctCount++;
            }
        });
        const score = (correctCount / quiz.questions.length) * 100;
        onSubmit(score >= quiz.passingScore, score);
    };

    const handleAnswerChange = (qIndex: number, answerIndex: number, type: 'single' | 'multiple') => {
        if (type === 'single') {
            setSelectedAnswers(prev => ({ ...prev, [qIndex]: answerIndex }));
        } else {
            const currentAnswers = (selectedAnswers[qIndex] as number[] || []);
            const newAnswers = currentAnswers.includes(answerIndex)
                ? currentAnswers.filter(a => a !== answerIndex)
                : [...currentAnswers, index];
            setSelectedAnswers(prev => ({...prev, [qIndex]: newAnswers}));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Lesson Quiz</DialogTitle>
                    <DialogDescription>Answer the questions to mark this lesson as complete.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    {quiz.questions.map((q, qIndex) => (
                        <div key={qIndex}>
                            <p className="font-semibold mb-2">{q.question}</p>
                            {q.type === 'single' && (
                                <RadioGroup onValueChange={(val) => handleAnswerChange(qIndex, parseInt(val), 'single')}>
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center space-x-2">
                                            <RadioGroupItem value={String(optIndex)} id={`q${qIndex}-opt${optIndex}`} />
                                            <Label htmlFor={`q${qIndex}-opt${optIndex}`}>{opt}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                             {q.type === 'multiple' && (
                                 <div className="space-y-2">
                                    {q.options.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`q${qIndex}-opt${optIndex}`}
                                                onCheckedChange={() => handleAnswerChange(qIndex, optIndex, 'multiple')}
                                            />
                                            <Label htmlFor={`q${qIndex}-opt${optIndex}`}>{opt}</Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Submit Answers</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function LessonView({ lesson, quiz, allLessonsForCourse }: { lesson: Lesson; quiz: Quiz | null; allLessonsForCourse: Lesson[] }) {
  const playerRef = useRef<ReactPlayer>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showQuiz, setShowQuiz] = useState(false);
  
  const handleProgress = async ({ playedSeconds }: { playedSeconds: number }) => {
    if (!firestore || !user) return;
    const progressRef = doc(firestore, 'userProgress', `${user.id}_${lesson.courseId}`);
    
    await setDoc(progressRef, {
        lessonProgress: {
            [lesson.id]: { watchedSeconds: playedSeconds }
        }
    }, { merge: true });
  };
  
  const handleLessonEnd = async () => {
    if (quiz) {
      setShowQuiz(true);
    } else {
      // No quiz, so mark as complete
      await markLessonAsComplete(true);
    }
  };

  const issueCertificate = async (course: Course) => {
    if (!firestore || !user) return;

    try {
        const certificatesCollection = collection(firestore, 'certificates');
        const newCertRef = doc(certificatesCollection);
        
        await setDoc(newCertRef, {
            userId: user.id,
            courseId: course.id,
            issuedAt: serverTimestamp(),
            verificationCode: uuidv4(),
            pdfUrl: '', // Placeholder
        });

        const userRef = doc(firestore, 'staff', user.id);
        await updateDoc(userRef, {
            certificates: arrayUnion(newCertRef.id)
        });

        const progressRef = doc(firestore, 'userProgress', `${user.id}_${course.id}`);
        await updateDoc(progressRef, { completed: true });

        toast({
            title: "Congratulations! Course Completed!",
            description: `You have earned a certificate for completing "${course.title}".`,
            duration: 10000
        });

    } catch (error) {
        console.error("Error issuing certificate:", error);
        toast({ title: 'Certificate Error', description: 'Could not issue your certificate.', variant: 'destructive'});
    }
  };

  const markLessonAsComplete = async (isCorrect: boolean, score?: number) => {
    if (!firestore || !user) return;
    setShowQuiz(false);

    if (isCorrect) {
        const progressRef = doc(firestore, 'userProgress', `${user.id}_${lesson.courseId}`);
        const updatePayload: any = {
            [`lessonProgress.${lesson.id}.completed`]: true,
        };

        if (quiz && score !== undefined) {
             updatePayload[`quizScores.${quiz.id}`] = score;
        }
        
        await updateDoc(progressRef, updatePayload);
        toast({ title: "Lesson Complete!", description: "You can now move to the next lesson." });

        // Check if course is complete
        const progressSnap = await getDoc(progressRef);
        const progressData = progressSnap.data() as UserProgress;

        if (allLessonsForCourse.length > 0 && Object.values(progressData.lessonProgress || {}).filter(p => p.completed).length === allLessonsForCourse.length && !progressData.completed) {
            const courseRef = doc(firestore, 'courses', lesson.courseId);
            const courseSnap = await getDoc(courseRef);
            if(courseSnap.exists()){
                await issueCertificate(courseSnap.data() as Course);
            }
        }
    } else {
        toast({ title: "Quiz Failed", description: `You did not meet the passing score of ${quiz?.passingScore}%. Please review the video and try again.`, variant: "destructive" });
        if (playerRef.current) {
            playerRef.current.seekTo(0);
        }
    }
  };

  return (
    <div>
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black mb-4">
             <ReactPlayer
                ref={playerRef}
                url={lesson.videoUrl}
                width="100%"
                height="100%"
                controls
                onProgress={handleProgress}
                onEnded={handleLessonEnd}
            />
        </div>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {quiz && showQuiz && <QuizModal quiz={quiz} isOpen={showQuiz} onSubmit={markLessonAsComplete} />}
    </div>
  )
}

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const firestore = useFirestore();

  const lessonRef = useMemo(() => firestore ? doc(firestore, 'lessons', lessonId) : null, [firestore, lessonId]);
  const { data: lesson, loading: lessonLoading } = useDoc<Lesson>(lessonRef);
  
  const quizQuery = useMemo(() => firestore && lessonId ? query(collection(firestore, 'quizzes'), where('lessonId', '==', lessonId)) : null, [firestore, lessonId]);
  const { data: quizzes, loading: quizLoading } = useCollection<Quiz>(quizQuery);

  const allLessonsQuery = useMemo(() => firestore && lesson?.courseId ? query(collection(firestore, 'lessons'), where('courseId', '==', lesson.courseId)) : null, [firestore, lesson]);
  const { data: allLessonsForCourse, loading: allLessonsLoading } = useCollection<Lesson>(allLessonsQuery);


  const quiz = useMemo(() => (quizzes && quizzes.length > 0 ? quizzes[0] : null), [quizzes]);

  const loading = lessonLoading || quizLoading || allLessonsLoading;

  return (
    <main>
       <div className="mb-6">
            {lesson && (
                 <Button asChild variant="outline" size="sm">
                    <Link href={`/training/course/${lesson.courseId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Course
                    </Link>
                </Button>
            )}
        </div>
      {loading ? (
        <div className="space-y-4">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-8 w-1/2" />
        </div>
      ) : lesson ? (
        <LessonView lesson={lesson} quiz={quiz} allLessonsForCourse={allLessonsForCourse || []} />
      ) : (
        <p>Lesson not found.</p>
      )}
    </main>
  );
}
