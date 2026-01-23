
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Edit, Trash2, ListChecks, Settings, PlusCircle, Save } from 'lucide-react';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { type Lesson, type Quiz, type QuizQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const questionSchema = z.object({
  type: z.enum(['single', 'multiple', 'open']),
  question: z.string().min(5, 'Question text is required.'),
  options: z.array(z.string()).default(['', '', '', '']),
  correctIndex: z.coerce.number().optional(),
  correctIndices: z.array(z.number()).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'single' || data.type === 'multiple') {
    if (data.options.length !== 4 || data.options.some(opt => opt.trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "All four options are required.", path: ["options"] });
    }
  }
  if (data.type === 'single') {
    if (data.correctIndex === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select the correct answer.", path: ["correctIndex"] });
    }
  }
  if (data.type === 'multiple') {
    if (!data.correctIndices || data.correctIndices.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select at least one correct answer.", path: ["correctIndices"] });
    }
  }
});


type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuizManagerDialogProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
}

export function QuizManagerDialog({ lesson, isOpen, onClose }: QuizManagerDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [quizDocId, setQuizDocId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [passingScore, setPassingScore] = useState(80);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const quizQuery = useMemo(
    () =>
      firestore
        ? query(collection(firestore, 'quizzes'), where('lessonId', '==', lesson.id))
        : null,
    [firestore, lesson.id]
  );
  const { data: quizData, loading: quizLoading } = useCollection<Quiz>(quizQuery);

  useEffect(() => {
    if (quizData && quizData.length > 0) {
      const q = quizData[0];
      setQuizDocId(q.id);
      setQuestions(q.questions || []);
      setPassingScore(q.passingScore || 80);
    } else {
      setQuizDocId(null);
      setQuestions([]);
      setPassingScore(80);
    }
  }, [quizData]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: { type: 'single', question: '', options: ['', '', '', ''], correctIndex: undefined, correctIndices: [] },
  });

  const watchedType = watch('type');

  useEffect(() => {
    if (editingQuestion) {
      reset({
        type: editingQuestion.type,
        question: editingQuestion.question,
        options: editingQuestion.options || ['', '', '', ''],
        correctIndex: editingQuestion.correctIndex,
        correctIndices: editingQuestion.correctIndices || [],
      });
    } else {
      reset({ type: 'single', question: '', options: ['', '', '', ''], correctIndex: undefined, correctIndices: [] });
    }
  }, [editingQuestion, reset]);

  const handleSaveQuestion = async (formData: QuestionFormValues) => {
    if (!firestore) return;

    const sanitizedData: QuizQuestion = {
        type: formData.type,
        question: formData.question,
        options: [],
    };

    if (formData.type === 'single') {
        sanitizedData.options = formData.options!;
        sanitizedData.correctIndex = formData.correctIndex;
    } else if (formData.type === 'multiple') {
        sanitizedData.options = formData.options!;
        sanitizedData.correctIndices = formData.correctIndices;
    }
    
    let updatedQuestions: QuizQuestion[];
    if (editingQuestion) {
        const index = questions.indexOf(editingQuestion);
        updatedQuestions = [...questions];
        if (index > -1) {
            updatedQuestions[index] = sanitizedData;
        }
    } else {
        updatedQuestions = [...questions, sanitizedData];
    }
    
    try {
        if (quizDocId) {
            const quizRef = doc(firestore, 'quizzes', quizDocId);
            await updateDoc(quizRef, { questions: updatedQuestions });
        } else {
            const quizzesCollection = collection(firestore, 'quizzes');
            const newQuizData = {
                lessonId: lesson.id,
                type: 'endLesson' as const,
                passingScore,
                questions: updatedQuestions,
            };
            const newDocRef = await addDoc(quizzesCollection, newQuizData);
            setQuizDocId(newDocRef.id);
        }
        setQuestions(updatedQuestions);
        setEditingQuestion(null);
        toast({ title: 'Question Saved' });
    } catch (error) {
        toast({ title: 'Error Saving Question', variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (questionToDelete: QuizQuestion) => {
    if (!firestore || !quizDocId) return;
    const updatedQuestions = questions.filter(q => q !== questionToDelete);
    const quizRef = doc(firestore, 'quizzes', quizDocId);
    try {
        await updateDoc(quizRef, { questions: updatedQuestions });
        setQuestions(updatedQuestions);
        toast({ title: 'Question Deleted' });
    } catch (error) {
         toast({ title: 'Error Deleting Question', variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    if (!firestore) return;
    setIsSavingSettings(true);
     try {
        if (quizDocId) {
            const quizRef = doc(firestore, 'quizzes', quizDocId);
            await updateDoc(quizRef, { passingScore });
        } else {
             const quizzesCollection = collection(firestore, 'quizzes');
             const newQuizData = {
                lessonId: lesson.id,
                type: 'endLesson' as const,
                passingScore,
                questions: [],
            };
            await addDoc(quizzesCollection, newQuizData);
        }
        toast({ title: 'Settings Saved', description: `Passing score set to ${passingScore}%.`});
    } catch (error) {
        toast({ title: 'Error Saving Settings', variant: 'destructive' });
    } finally {
        setIsSavingSettings(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage Quiz for: {lesson.title}</DialogTitle>
          <DialogDescription>
            Add, edit, or remove questions for this lesson's quiz.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Settings Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="text-primary text-xl" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Quiz Settings</h4>
                </div>
                <div className="flex items-end gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <Label htmlFor="passingScore" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Passing Score (0-100%)</Label>
                        <Input 
                            id="passingScore"
                            type="number"
                            value={passingScore}
                            onChange={(e) => setPassingScore(parseInt(e.target.value, 10))}
                            className="max-w-[120px] text-center"
                        />
                    </div>
                     <Button onClick={handleSaveSettings} disabled={isSavingSettings} size="sm">
                        {isSavingSettings ? 'Saving...' : 'Save Settings'}
                    </Button>
                </div>
            </section>

             {/* Question List Section */}
            <section>
                 <div className="flex items-center gap-2 mb-4">
                    <ListChecks className="text-primary text-xl" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Question List ({questions.length})</h4>
                </div>
                <div className="space-y-3">
                    {quizLoading ? <Skeleton className="h-20 w-full" /> :
                     questions.length > 0 ? (
                        questions.map((q, index) => (
                             <div key={index} className="flex items-start justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/50 transition-all shadow-sm">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{index + 1}. {q.question}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">{q.type.replace('-', ' ')}</Badge>
                                        {q.type === 'single' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                Correct: "{q.options[q.correctIndex!]}"
                                            </span>
                                        )}
                                         {q.type === 'multiple' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                                {q.correctIndices?.length} correct answers
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingQuestion(q)}><Edit size={16} /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteQuestion(q)}><Trash2 size={16} /></Button>
                                </div>
                            </div>
                        ))
                     ) : <p className="text-sm text-center text-muted-foreground py-4">No questions yet. Add one below.</p>
                    }
                </div>
            </section>
            
            {/* Form Section */}
            <section className="border-t border-slate-200 dark:border-slate-800 pt-8">
                <div className="flex items-center gap-2 mb-6">
                    <PlusCircle className="text-primary text-xl" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">{editingQuestion ? 'Edit Question' : 'New Question'}</h4>
                </div>
                 <form onSubmit={handleSubmit(handleSaveQuestion)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="question" className="font-semibold">Question Text</Label>
                            <Textarea id="question" {...register('question')} className="mt-2" />
                            {errors.question && <p className="text-xs text-destructive mt-1">{errors.question.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="type" className="font-semibold">Question Type</Label>
                             <Controller
                                control={control}
                                name="type"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger id="type" className="mt-2">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">Single Choice</SelectItem>
                                            <SelectItem value="multiple">Multiple Choice</SelectItem>
                                            <SelectItem value="open">Open Answer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </div>
                    {watchedType !== 'open' && (
                        <div>
                            <Label className="font-semibold">Options & Correct Answer</Label>
                            {watchedType === 'single' && (
                                <Controller
                                    control={control}
                                    name="correctIndex"
                                    render={({ field }) => (
                                        <RadioGroup onValueChange={field.onChange} value={String(field.value)} className="mt-2 space-y-2">
                                            {[0, 1, 2, 3].map(index => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <Input {...register(`options.${index}`)} placeholder={`Option ${index + 1}`} />
                                                    </div>
                                                    <RadioGroupItem value={String(index)} id={`option-${index}`} />
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                />
                            )}
                            {watchedType === 'multiple' && (
                                 <Controller
                                    name="correctIndices"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="mt-2 space-y-2">
                                            {[0, 1, 2, 3].map(index => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <Input {...register(`options.${index}`)} placeholder={`Option ${index + 1}`} />
                                                    </div>
                                                     <Checkbox
                                                        checked={field.value?.includes(index)}
                                                        onCheckedChange={(checked) => {
                                                            const current = field.value || [];
                                                            if (checked) {
                                                                field.onChange([...current, index]);
                                                            } else {
                                                                field.onChange(current.filter(i => i !== index));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            )}
                            {errors.options && <p className="text-xs text-destructive mt-1">{errors.options.message}</p>}
                            {errors.correctIndex && <p className="text-xs text-destructive mt-1">{errors.correctIndex.message}</p>}
                             {errors.correctIndices && <p className="text-xs text-destructive mt-1">{errors.correctIndices.message}</p>}
                        </div>
                    )}
                     <div className="flex justify-end gap-2">
                        {editingQuestion && <Button type="button" variant="ghost" onClick={() => setEditingQuestion(null)}>Cancel Edit</Button>}
                        <Button type="submit" disabled={isSubmitting}>
                           <Save size={16} className="mr-2"/> {editingQuestion ? 'Save Changes' : 'Save Question'}
                        </Button>
                    </div>
                 </form>
            </section>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
