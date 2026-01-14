
'use client';

import type { ColumnDef, Row } from '@tanstack/react-table';
import type { Candidate, PipelineStatus } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronsUpDown, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const stageColors: Record<PipelineStatus, string> = {
  "New Applicant": "bg-gray-100 text-gray-800 border-gray-200",
  "Pre-Filter Approved": "bg-blue-100 text-blue-800 border-blue-200",
  "5-Minute Filter": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Approved": "bg-teal-100 text-teal-800 border-teal-200",
  "Onboarding": "bg-purple-100 text-purple-800 border-purple-200",
  "Active": "bg-green-100 text-green-800 border-green-200",
  "Rejected": "bg-red-100 text-red-800 border-red-200",
  "Inactive": "bg-slate-100 text-slate-800 border-slate-200",
};

const statusOptions: Record<PipelineStatus, PipelineStatus[]> = {
    'New Applicant': ['Pre-Filter Approved', '5-Minute Filter', 'Approved', 'Onboarding', 'Rejected', 'Inactive'],
    'Pre-Filter Approved': ['5-Minute Filter', 'Approved', 'Onboarding', 'Rejected', 'Inactive'],
    '5-Minute Filter': ['Approved', 'Onboarding', 'Rejected', 'Inactive'],
    'Approved': ['Onboarding', 'Rejected', 'Inactive'],
    'Onboarding': ['Rejected', 'Inactive'],
    'Active': ['Inactive'],
    'Rejected': [],
    'Inactive': ['New Applicant'], // Can be reactivated
};

const CellActions: React.FC<{ row: Row<Candidate> }> = ({ row }) => {
    const candidate = row.original;
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(candidate.email);
        toast({ title: 'Email Copied', description: `${candidate.email} copied to clipboard.` });
    };

    const handleStatusChange = async (newStatus: PipelineStatus) => {
        if (!firestore) return;
        const candidateRef = doc(firestore, 'candidates', candidate.id);
        try {
            await updateDoc(candidateRef, {
                pipelineStatus: newStatus,
                lastStatusChangeDate: serverTimestamp(),
            });
            toast({ title: 'Status Updated', description: `${candidate.fullName}'s status changed to ${newStatus}.` });
        } catch (error) {
            toast({ title: 'Update Failed', description: 'Could not update candidate status.', variant: 'destructive' });
        }
    };

    const availableOptions = statusOptions[candidate.pipelineStatus] || [];

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
            <DropdownMenuItem onSelect={handleCopyEmail}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Email
            </DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                    Change Status
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    {availableOptions.length > 0 ? (
                        availableOptions.map(status => (
                            <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)}>
                                {status}
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                    )}
                </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );
}

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
        const status = row.getValue('pipelineStatus') as PipelineStatus;
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
    cell: ({ row }) => <CellActions row={row} />,
  },
];
