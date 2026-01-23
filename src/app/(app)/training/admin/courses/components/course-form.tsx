'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Course } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  passingScore: z.coerce.number().min(0).max(100, 'Score must be between 0 and 100.'),
  thumbnailUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  initialData?: Course;
}

export function CourseForm({ initialData }: CourseFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: isEditing ? {
        title: initialData.title,
        description: initialData.description,
        passingScore: initialData.passingScore,
        thumbnailUrl: initialData.thumbnailUrl || '',
    } : {
        passingScore: 80,
    }
  });

  const onSubmit = async (data: CourseFormValues) => {
    if (!firestore || !user) return;
    
    try {
      if (isEditing && initialData) {
        const courseRef = doc(firestore, 'courses', initialData.id);
        await updateDoc(courseRef, data);
        toast({ title: 'Course Updated', description: `"${data.title}" has been saved.` });
      } else {
        await addDoc(collection(firestore, 'courses'), {
          ...data,
          authorId: user.id,
          published: false,
          isDefaultOnboarding: false,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Course Created', description: 'Your new course has been saved as a draft.' });
      }
      router.push('/training/admin/courses');
      router.refresh(); // To ensure the list is up-to-date
    } catch (error) {
      toast({ title: 'Save Failed', description: 'Could not save the course details.', variant: 'destructive' });
    }
  };

  return (
     <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-4 mb-6">
            <Button type="button" variant="outline" size="icon" onClick={() => router.push('/training/admin/courses')}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h1 className="text-xl font-bold">{isEditing ? 'Edit Course' : 'Create New Course'}</h1>
                <p className="text-sm text-muted-foreground">
                    {isEditing ? `Editing "${initialData?.title}"` : 'Fill in the details for the new course.'}
                </p>
            </div>
        </div>

        <Card>
            <CardContent className="pt-6 grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input id="title" {...register('title')} />
                    {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description">Course Description</Label>
                    <Textarea id="description" {...register('description')} />
                    {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="thumbnailUrl">Thumbnail URL (Optional)</Label>
                    <Input id="thumbnailUrl" {...register('thumbnailUrl')} placeholder="https://example.com/image.png" />
                    {errors.thumbnailUrl && <p className="text-xs text-red-500">{errors.thumbnailUrl.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input id="passingScore" type="number" {...register('passingScore')} />
                    {errors.passingScore && <p className="text-xs text-red-500">{errors.passingScore.message}</p>}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Course')}
                </Button>
            </CardFooter>
        </Card>
    </form>
  );
}
