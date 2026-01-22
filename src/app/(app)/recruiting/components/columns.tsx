'use client';

import type { ColumnDef, Row } from '@tanstack/react-table';
import type { Candidate, Application, PipelineStatus } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronsUpDown, Copy, Star, Briefcase, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
  "Interviews": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Approved": "bg-teal-100 text-teal-800 border-teal-200",
  "Onboarding": "bg-purple-100 text-purple-800 border-purple-200",
  "Active": "bg-green-100 text-green-800 border-green-200",
  "Rejected": "bg-red-100 text-red-800 border-red-200",
  "Inactive": "bg-slate-100 text-slate-800 border-slate-200",
};

const statusOptions: Record<PipelineStatus, PipelineStatus[]> = {
    'New Applicant': ['Interviews', 'Approved', 'Onboarding', 'Rejected', 'Inactive'],
    'Interviews': ['Approved', 'Onboarding', 'Rejected', 'Inactive'],
    'Approved': ['Onboarding', 'Rejected', 'Inactive'],
    'Onboarding': ['Active', 'Rejected', 'Inactive'],
    'Active': ['Inactive'],
    'Rejected': ['New Applicant', 'Inactive'],
    'Inactive': ['New Applicant', 'Rejected'],
};

const CellActions: React.FC<{ row: Row<Candidate>; onCreateStaff: (candidate: Candidate) => void; onDelete: (candidate: Candidate) => void; }> = ({ row, onCreateStaff, onDelete }) => {
    const candidate = row.original;
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(candidate.email);
        toast({ title: 'Email Copied', description: `${candidate.email} copied to clipboard.` });
    };

    const handleStatusChange = async (newStatus: PipelineStatus) => {
        if (!firestore) return;

        try {
            const candidateRef = doc(firestore, 'candidates', candidate.id);
            await updateDoc(candidateRef, {
                pipelineStatus: newStatus,
                lastStatusChangeDate: serverTimestamp(),
            });
            
            toast({ title: 'Status Updated', description: `${candidate.fullName}'s status changed to ${newStatus}.` });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({ title: 'Update Failed', description: 'Could not update candidate status.', variant: 'destructive' });
        }
    };


    const availableOptions = statusOptions[candidate.pipelineStatus] || [];
    const canCreateProfile = candidate.pipelineStatus === 'Approved' || candidate.pipelineStatus === 'Onboarding';

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
            {availableOptions.length > 0 && (
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <ChevronsUpDown className="mr-2 h-4 w-4" />
                        Change Status
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {availableOptions.map(status => (
                            <DropdownMenuItem 
                                key={status} 
                                onSelect={() => handleStatusChange(status)}
                                className={cn({
                                    'text-destructive focus:text-destructive': status === 'Rejected' || status === 'Inactive'
                                })}
                            >
                                {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
                onSelect={() => onCreateStaff(candidate)}
                disabled={!canCreateProfile}
                className={cn({ "focus:bg-blue-50 focus:text-blue-700": canCreateProfile })}
            >
                <Briefcase className="mr-2 h-4 w-4" />
                Create Staff Profile
            </DropdownMenuItem>
            {user?.role === 'Admin' && candidate.pipelineStatus === 'Inactive' && (
              <>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Candidate
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the candidate profile for <span className="font-bold">{candidate.fullName}</span>. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(candidate)} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete candidate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
}

const ScoreBadge = ({ score }: { score?: number }) => {
    if (score === undefined || score === null) return null;
    
    let colorClass = 'bg-slate-100 text-slate-700';
    if (score >= 80) {
        colorClass = 'bg-green-100 text-green-800';
    } else if (score >= 60) {
        colorClass = 'bg-blue-100 text-blue-800';
    } else {
        colorClass = 'bg-red-100 text-red-700';
    }

    return (
        <Badge className={cn('flex items-center gap-1', colorClass)}>
            <Star size={12} />
            <span className="font-bold">{score}</span>
        </Badge>
    );
};


export const getColumns = (onViewDetails: (candidate: Candidate) => void, onCreateStaff: (candidate: Candidate) => void, onDelete: (candidate: Candidate) => void): ColumnDef<Candidate>[] => [
  {
    accessorKey: 'fullName',
    header: 'Candidate',
    cell: ({ row }) => {
      const candidate = row.original;
      return (
        <button
          onClick={() => onViewDetails(candidate)}
          className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-slate-50 -m-2"
        >
          <Avatar>
            {candidate.avatarUrl && <AvatarImage src={candidate.avatarUrl} alt={candidate.fullName} />}
            <AvatarFallback>{getAvatarFallback(candidate.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-primary hover:underline">{candidate.fullName}</span>
            <span className="text-xs text-muted-foreground">{candidate.email}</span>
          </div>
        </button>
      );
    },
  },
  {
    accessorKey: 'score',
    header: 'Score',
    cell: ({ row }) => {
        const score = row.original.score;
        return <ScoreBadge score={score} />;
    }
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
    cell: ({ row }) => <CellActions row={row} onCreateStaff={onCreateStaff} onDelete={onDelete} />,
  },
];
