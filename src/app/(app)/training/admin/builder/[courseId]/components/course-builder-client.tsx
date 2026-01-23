'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  type Course,
  type Module,
  type Lesson,
} from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  writeBatch,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModuleList } from './module-list';
import { EditPanel } from './edit-panel';
import { useToast } from '@/hooks/use-toast';
import { QuizManagerDialog } from './quiz-manager-dialog';

interface CourseBuilderClientProps {
  course: Course;
}

export function CourseBuilderClient({ course }: CourseBuilderClientProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [editingItem, setEditingItem] = useState<{
    type: 'module' | 'lesson';
    data: Partial<Module> | Partial<Lesson> | null;
    moduleId?: string; // To know which module a new lesson belongs to
  } | null>(null);

  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null);

  const modulesQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'modules'),
            where('courseId', '==', course.id),
            orderBy('order')
          )
        : null,
    [firestore, course.id]
  );
  const { data: modules, loading: modulesLoading } = useCollection<Module>(modulesQuery);

  const lessonsQuery = useMemo(
    () =>
      firestore
        ? query(
            collection(firestore, 'lessons'),
            where('courseId', '==', course.id),
            orderBy('order')
          )
        : null,
    [firestore, course.id]
  );
  const { data: lessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  
  const handleEdit = useCallback((type: 'module' | 'lesson', data: Module | Lesson) => {
    setEditingItem({ type, data });
  }, []);

  const handleAddNew = useCallback((type: 'module' | 'lesson', moduleId?: string) => {
    setEditingItem({ type, data: null, moduleId });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
  }, []);
  
  const handleManageQuiz = (lesson: Lesson) => {
    setQuizLesson(lesson);
  };

  const handleSave = async (
    type: 'module' | 'lesson',
    data: Partial<Module> & Partial<Lesson>
  ) => {
    if (!firestore) return;

    try {
      if (data.id) {
        // Update existing item
        const ref = doc(firestore, `${type}s`, data.id);
        await updateDoc(ref, data);
        toast({ title: `${type} Updated`, description: `The ${type} has been saved.`});
      } else {
        // Create new item
        const newOrder = type === 'module' 
            ? (modules?.length || 0)
            : (lessons?.filter(l => l.moduleId === editingItem?.moduleId).length || 0);

        const collectionName = `${type}s`;
        
        const newDocData: any = {
            ...data,
            courseId: course.id,
            order: newOrder,
            createdAt: serverTimestamp(),
        };

        if (type === 'lesson') {
            newDocData.moduleId = editingItem?.moduleId;
        }
        
        await addDoc(collection(firestore, collectionName), newDocData);
        toast({ title: `${type} Created`, description: `A new ${type} has been added.`});
      }
      setEditingItem(null);
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      toast({ title: 'Save Failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (type: 'module' | 'lesson', id: string) => {
     if (!firestore || !window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
     
     try {
        const ref = doc(firestore, `${type}s`, id);
        await deleteDoc(ref);
        
        // If deleting a module, delete its lessons too
        if (type === 'module' && lessons) {
            const batch = writeBatch(firestore);
            const lessonsToDelete = lessons.filter(l => l.moduleId === id);
            lessonsToDelete.forEach(lesson => {
                const lessonRef = doc(firestore, 'lessons', lesson.id);
                batch.delete(lessonRef);
            });
            await batch.commit();
        }

        toast({ title: `${type} Deleted` });
        if (editingItem?.data?.id === id) {
            setEditingItem(null);
        }
     } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        toast({ title: 'Deletion Failed', variant: 'destructive' });
     }
  };

  const handleReorder = async (
    type: 'module' | 'lesson',
    reorderedItems: (Module[] | Lesson[])
  ) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    reorderedItems.forEach((item, index) => {
      const ref = doc(firestore, `${type}s`, item.id);
      batch.update(ref, { order: index });
    });

    try {
      await batch.commit();
      toast({ title: 'Order Saved', description: 'The new order has been saved.' });
    } catch (error) {
      console.error('Reordering failed:', error);
      toast({ title: 'Reorder Failed', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-border-light dark:border-slate-800 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon" className="h-9 w-9">
              <Link href="/training/admin/courses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <nav className="text-xs text-slate-500 mb-0.5">
                <span>Courses / Builder</span>
              </nav>
              <h1 className="text-sm font-bold tracking-tight">{course.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">Preview Course</Button>
            <Button size="sm">Publish Changes</Button>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="w-full md:w-[60%] flex flex-col bg-slate-50 dark:bg-slate-950 border-r border-border-light dark:border-slate-800 overflow-y-auto">
            <ModuleList
              modules={modules || []}
              lessons={lessons || []}
              loading={modulesLoading || lessonsLoading}
              onAddNew={handleAddNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onManageQuiz={handleManageQuiz}
            />
          </main>
          <aside className="hidden md:flex w-[40%] flex-col bg-white dark:bg-slate-900 overflow-hidden">
            <EditPanel 
              editingItem={editingItem}
              onSave={handleSave}
              onCancel={handleCancelEdit}
            />
          </aside>
        </div>
      </div>
      {quizLesson && (
        <QuizManagerDialog 
            lesson={quizLesson}
            isOpen={!!quizLesson}
            onClose={() => setQuizLesson(null)}
        />
      )}
    </>
  );
}
