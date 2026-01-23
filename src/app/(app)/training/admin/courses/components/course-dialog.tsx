'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Course } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  passingScore: z.coerce.number().min(0).max(100, 'Score must be between 0 and 100.'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CourseFormValues) => void;
  initialData?: Course | null;
}

export function CourseDialog({ isOpen, onClose, onSave, initialData }: CourseDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        description: initialData.description,
        passingScore: initialData.passingScore,
      });
    } else {
      reset({
        title: '',
        description: '',
        passingScore: 80, // Default passing score
      });
    }
  }, [initialData, reset, isOpen]);

  const isEditing = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this course.' : 'Fill in the details for the new course.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="grid gap-6 py-4">
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
            <Label htmlFor="passingScore">Passing Score (%)</Label>
            <Input id="passingScore" type="number" {...register('passingScore')} />
            {errors.passingScore && <p className="text-xs text-red-500">{errors.passingScore.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Course')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
