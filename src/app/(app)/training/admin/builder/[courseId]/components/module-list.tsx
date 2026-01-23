'use client';

import { useState } from 'react';
import type { Module, Lesson } from '@/lib/types';
import { GripVertical, Plus, Edit, Trash2, PlayCircle, BookText, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ModuleListProps {
  modules: Module[];
  lessons: Lesson[];
  loading: boolean;
  onAddNew: (type: 'module' | 'lesson', moduleId?: string) => void;
  onEdit: (type: 'module' | 'lesson', data: Module | Lesson) => void;
  onDelete: (type: 'module' | 'lesson', id: string) => void;
  onReorder: (type: 'module' | 'lesson', reorderedItems: any[]) => void;
  onManageQuiz: (lesson: Lesson) => void;
}

export function ModuleList({
  modules,
  lessons,
  loading,
  onAddNew,
  onEdit,
  onDelete,
  onReorder,
  onManageQuiz,
}: ModuleListProps) {
  
  const [draggedItem, setDraggedItem] = useState<{type: 'module' | 'lesson', id: string} | null>(null);

  const handleDragStart = (e: React.DragEvent, type: 'module' | 'lesson', id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ type, id });
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, type: 'module' | 'lesson', targetId: string, targetModuleId?: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type) {
      setDraggedItem(null);
      return;
    }

    const list = type === 'module' ? [...modules] : [...lessons.filter(l => l.moduleId === targetModuleId)];
    const draggedIndex = list.findIndex(item => item.id === draggedItem.id);
    const targetIndex = list.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const [removed] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, removed);
    
    onReorder(type, list);
    setDraggedItem(null);
  };
  
  if (loading) {
    return (
       <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
      {modules.map((module) => {
        const moduleLessons = lessons.filter(l => l.moduleId === module.id);
        return (
          <div
            key={module.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-border-light dark:border-slate-800 shadow-sm overflow-hidden"
            draggable
            onDragStart={(e) => handleDragStart(e, 'module', module.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'module', module.id)}
          >
            <div className="p-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <GripVertical className="cursor-grab drag-handle text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Module {module.order + 1}
                    </span>
                    <h3 className="text-sm font-semibold">{module.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddNew('lesson', module.id)}><Plus size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit('module', module)}><Edit size={16} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => onDelete('module', module.id)}><Trash2 size={16} /></Button>
                </div>
            </div>
             <div className="p-3 space-y-2">
                {moduleLessons.length > 0 ? moduleLessons.map((lesson, index) => (
                    <div
                        key={lesson.id}
                        className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'lesson', lesson.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'lesson', lesson.id, module.id)}
                    >
                        <div className="flex items-center gap-3">
                            <GripVertical className="cursor-grab drag-handle text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <PlayCircle size={18} className="text-slate-400" />
                            <span className="text-sm font-medium">{lesson.order + 1}.{index + 1} {lesson.title}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 uppercase">
                                {lesson.duration} min
                            </span>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onManageQuiz(lesson)}><ClipboardList size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit('lesson', lesson)}><Edit size={14} /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => onDelete('lesson', lesson.id)}><Trash2 size={14} /></Button>
                        </div>
                    </div>
                )) : (
                     <div className="p-3">
                        <button onClick={() => onAddNew('lesson', module.id)} className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs font-medium hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2">
                            <Plus size={14} /> Add First Lesson
                        </button>
                    </div>
                )}
             </div>
          </div>
        );
      })}
       <button onClick={() => onAddNew('module')} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm font-semibold hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
           <Plus size={16}/> Create New Module
       </button>
    </div>
  );
}
