'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Module, type Lesson } from '@/lib/types';
import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Video, BookText } from 'lucide-react';

const moduleSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
});

const lessonSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  videoUrl: z.string().url('Must be a valid URL.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
});

interface EditPanelProps {
  editingItem: {
    type: 'module' | 'lesson';
    data: Partial<Module> | Partial<Lesson> | null;
  } | null;
  onSave: (
    type: 'module' | 'lesson',
    data: Partial<Module> & Partial<Lesson>
  ) => void;
  onCancel: () => void;
}

export function EditPanel({ editingItem, onSave, onCancel }: EditPanelProps) {
  const isModule = editingItem?.type === 'module';
  const isLesson = editingItem?.type === 'lesson';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isModule ? moduleSchema : lessonSchema),
  });
  
  useEffect(() => {
    if (editingItem?.data) {
        reset(editingItem.data);
    } else {
        reset(isModule ? { title: '' } : { title: '', videoUrl: '', duration: 0 });
    }
  }, [editingItem, reset, isModule]);
  
  const onSubmit = (data: any) => {
    const dataToSave = editingItem?.data?.id 
        ? { id: editingItem.data.id, ...data }
        : data;
    onSave(editingItem!.type, dataToSave);
  };

  if (!editingItem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
        <BookText size={48} className="mb-4 text-slate-300" />
        <h3 className="font-semibold text-slate-600">Course Builder</h3>
        <p className="text-sm">Select an item to edit, or create a new module to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold">
            {editingItem.data?.id ? 'Edit' : 'Create'} {editingItem.type}
          </h2>
          <p className="text-xs text-slate-500">
            {isModule ? 'Organize your course into sections.' : 'Add a video lesson to your module.'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="size-8">
            <X size={16} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                {editingItem.type} Title
            </Label>
            <Input id="title" {...register('title')} placeholder={isModule ? "e.g., Introduction" : "e.g., Welcome to the Course"} />
            {errors.title && <p className="text-xs text-destructive">{(errors.title as any).message}</p>}
          </div>

          {isLesson && (
            <>
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Video URL</Label>
                <Input id="videoUrl" {...register('videoUrl')} placeholder="https://vimeo.com/..." />
                 {errors.videoUrl && <p className="text-xs text-destructive">{(errors.videoUrl as any).message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Duration (minutes)</Label>
                <Input id="duration" type="number" {...register('duration')} />
                 {errors.duration && <p className="text-xs text-destructive">{(errors.duration as any).message}</p>}
              </div>
            </>
          )}
        </form>
      </div>
       <div className="p-6 border-t border-border-light dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
            <Button onClick={handleSubmit(onSubmit)} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancel
            </Button>
        </div>
    </>
  );
}
