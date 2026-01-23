'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { UserProgress, Staff, Course } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type ProgressRow = {
  id: string;
  user: Partial<Staff>;
  course: Partial<Course>;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  rawProgress: UserProgress;
};

const getAvatarFallback = (name: string) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const getColumns = ({ onViewDetails }: { onViewDetails: (row: ProgressRow) => void }): ColumnDef<ProgressRow>[] => [
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getAvatarFallback(user.name || '')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      );
    },
    accessorFn: (row) => row.user.name,
  },
  {
    accessorKey: 'course',
    header: 'Course',
    cell: ({ row }) => {
      return <span className="font-medium">{row.original.course.title}</span>;
    },
    accessorFn: (row) => row.course.title,
  },
  {
    accessorKey: 'progressPercentage',
    header: 'Progress',
    cell: ({ row }) => {
      const { progressPercentage, completedLessons, totalLessons } = row.original;
      return (
        <div className="flex items-center gap-3">
          <Progress value={progressPercentage} className="w-24" />
          <span className="text-sm font-semibold">{progressPercentage}%</span>
          <span className="text-xs text-muted-foreground">({completedLessons}/{totalLessons})</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'isCompleted',
    header: 'Status',
    cell: ({ row }) => {
      const isCompleted = row.original.isCompleted;
      return (
        <Badge
          className={cn(
            isCompleted
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-blue-100 text-blue-700 border-blue-200'
          )}
        >
          {isCompleted ? 'Completed' : 'In Progress'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onViewDetails(row.original)}>View Details</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
