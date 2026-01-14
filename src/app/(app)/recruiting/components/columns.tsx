'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Candidate } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, isValid } from 'date-fns';

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const stageColors: Record<string, string> = {
  "New Applicant": "bg-gray-100 text-gray-800 border-gray-200",
  "Applied": "bg-gray-100 text-gray-800 border-gray-200",
  "Pre-Filter": "bg-blue-100 text-blue-800 border-blue-200",
  "5-Minute Filter": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Approved": "bg-green-100 text-green-800 border-green-200",
  "Onboarding": "bg-purple-100 text-purple-800 border-purple-200",
  "Active": "bg-green-500 text-white border-green-600",
  "Rejected": "bg-red-100 text-red-800 border-red-200",
};

export const getColumns = (): ColumnDef<Candidate>[] => [
  {
    accessorKey: 'fullName',
    header: 'Candidate',
    cell: ({ row }) => {
      const candidate = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            {candidate.avatarUrl && <AvatarImage src={candidate.avatarUrl} alt={candidate.fullName} />}
            <AvatarFallback>{getAvatarFallback(candidate.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{candidate.fullName}</span>
            <span className="text-xs text-muted-foreground">{candidate.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'pipelineStatus',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('pipelineStatus') as string;
        return <Badge className={stageColors[status] || 'bg-gray-100'}>{status}</Badge>
    }
  },
  {
    accessorKey: 'source',
    header: 'Source',
  },
  {
    accessorKey: 'recruiter',
    header: 'Recruiter',
  },
  {
    accessorKey: 'appliedDate',
    header: 'Applied',
    cell: ({ row }) => {
        const dateRaw = row.getValue("appliedDate");
        if (!dateRaw) return <span className="text-xs text-slate-400">N/A</span>;
        
        const date = (dateRaw as any).toDate ? (dateRaw as any).toDate() : new Date(dateRaw as string);
        
        if (!isValid(date)) {
          return <div className="text-xs text-slate-500">Invalid date</div>;
        }

        return (
            <div className="text-xs text-slate-500">
                {formatDistanceToNow(date, { addSuffix: true })}
            </div>
        )
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Change Status</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Reject</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
