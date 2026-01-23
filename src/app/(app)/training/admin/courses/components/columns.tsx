
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Course } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, BookOpen, Eye, EyeOff, Star } from 'lucide-react';
import { format, isValid } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ColumnActionsProps {
  course: Course;
  onEdit: (course: Course) => void;
  onTogglePublish: (course: Course) => void;
  onDelete: (courseId: string) => void;
  onSetDefault: (course: Course) => void;
}

const ColumnActions: React.FC<ColumnActionsProps> = ({ course, onEdit, onTogglePublish, onDelete, onSetDefault }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
           <Link href={`/training/admin/builder/${course.id}`}>
                <BookOpen className="mr-2 h-4 w-4" /> Build Course
           </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(course)}>
          <Edit className="mr-2 h-4 w-4" /> Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSetDefault(course)} disabled={course.isDefaultOnboarding}>
            <Star className="mr-2 h-4 w-4" /> Set as Default Onboarding
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onTogglePublish(course)}>
            {course.published ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {course.published ? 'Unpublish' : 'Publish'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => onDelete(course.id)} className="text-destructive focus:text-destructive">
                    Confirm Deletion
                </DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getColumns = (
    { onEdit, onTogglePublish, onDelete, onSetDefault } : { onEdit: (course: Course) => void; onTogglePublish: (course: Course) => void; onDelete: (courseId: string) => void; onSetDefault: (course: Course) => void; }
): ColumnDef<Course>[] => [
  {
    accessorKey: 'title',
    header: 'Course Title',
    cell: ({ row }) => {
      const course = row.original;
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{course.title}</span>
            {course.isDefaultOnboarding && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                    <Star className="mr-1 h-3 w-3" /> Default Onboarding
                </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{course.description}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'published',
    header: 'Status',
    cell: ({ row }) => {
      const isPublished = row.getValue('published') as boolean;
      return (
        <Badge
          className={cn(
            isPublished
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          )}
        >
          {isPublished ? 'Published' : 'Draft'}
        </Badge>
      );
    },
  },
  {
    header: 'Content',
    cell: () => {
      // Placeholder values as requested
      return <span className="text-sm text-muted-foreground">3 Modules, 12 Lessons</span>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as any;
      if (!date) return null;
      const jsDate = date.toDate ? date.toDate() : new Date(date);
      return isValid(jsDate) ? <span className="text-sm text-muted-foreground">{format(jsDate, 'MMM d, yyyy')}</span> : 'Invalid Date';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ColumnActions course={row.original} onEdit={onEdit} onTogglePublish={onTogglePublish} onDelete={onDelete} onSetDefault={onSetDefault} />,
  },
];

