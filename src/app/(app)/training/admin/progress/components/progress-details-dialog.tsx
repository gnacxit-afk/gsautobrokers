'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProgressRow } from './columns';
import { type Lesson } from '@/lib/types';
import { CheckCircle, Circle, Percent, BookOpen, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ProgressDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: ProgressRow | null;
  allLessons: Lesson[];
}

const DetailCard = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: React.ReactNode }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border">
        <Icon className="h-5 w-5 text-slate-500" />
        <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-sm font-semibold">{value}</p>
        </div>
    </div>
)

export function ProgressDetailsDialog({ isOpen, onClose, progressData, allLessons }: ProgressDetailsDialogProps) {
  if (!progressData) return null;

  const { user, course, rawProgress } = progressData;

  const sortedLessons = [...allLessons].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Progress Details: <span className="text-primary">{user.name}</span>
          </DialogTitle>
          <DialogDescription>
            Detailed view of progress for the course: "{course.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground">SUMMARY</h4>
                <DetailCard icon={Percent} title="Overall Progress" value={`${progressData.progressPercentage}%`} />
                <DetailCard icon={BookOpen} title="Lessons Completed" value={`${progressData.completedLessons} / ${progressData.totalLessons}`} />
                <Separator />
                <h4 className="text-sm font-bold text-muted-foreground">QUIZ SCORES</h4>
                {Object.keys(rawProgress.quizScores || {}).length > 0 ? (
                    Object.entries(rawProgress.quizScores).map(([quizId, score]) => (
                         <DetailCard key={quizId} icon={Percent} title={`Quiz ${quizId.substring(0, 5)}...`} value={`${score}%`} />
                    ))
                ) : (
                    <p className="text-xs text-muted-foreground text-center p-4 bg-slate-50 rounded-md">No quiz scores recorded yet.</p>
                )}
            </div>
            <div className="md:col-span-2 overflow-hidden flex flex-col">
                <h4 className="text-sm font-bold text-muted-foreground mb-4">LESSON PROGRESS</h4>
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-3">
                        {sortedLessons.map(lesson => {
                            const lessonProgress = rawProgress.lessonProgress?.[lesson.id];
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
                </ScrollArea>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
