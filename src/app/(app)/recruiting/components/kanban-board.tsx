'use client';

import type { Candidate, PipelineStatus } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Calendar, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const stageColors: Record<PipelineStatus, { bg: string, text: string }> = {
  "New Applicant": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
  "Interviews": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400" },
  "Approved": { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400" },
  "Onboarding": { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400" },
  "Active": { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-600 dark:text-teal-400" },
  "Rejected": { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-600 dark:text-red-400" },
  "Inactive": { bg: "bg-slate-100 dark:bg-slate-700", text: "text-slate-600 dark:text-slate-400" },
};

const pipelineStages: { status: PipelineStatus; label: string }[] = [
  { status: 'New Applicant', label: 'New Applicants' },
  { status: 'Interviews', label: 'Interviews' },
  { status: 'Approved', label: 'Approved for Onboarding' },
  { status: 'Onboarding', label: 'Training' },
  { status: 'Active', label: 'Active' },
  { status: 'Rejected', label: 'Rejected' },
];

const CandidateCard = ({ candidate }: { candidate: Candidate }) => {
    const appliedDate = candidate.appliedDate ? (candidate.appliedDate as any).toDate ? (candidate.appliedDate as any).toDate() : new Date(candidate.appliedDate as string) : new Date();

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, candidateId: string) => {
        e.dataTransfer.setData('candidateId', candidateId);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <Card 
            className="bg-white dark:bg-[#1a232e] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group cursor-grab active:cursor-grabbing"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, candidate.id)}
        >
            <CardContent className="p-0 space-y-3">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                         <Avatar className="size-10 rounded-lg">
                            {candidate.avatarUrl && <AvatarImage src={candidate.avatarUrl} />}
                            <AvatarFallback className="rounded-lg">{getAvatarFallback(candidate.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="text-sm font-bold text-[#111418] dark:text-white group-hover:text-primary transition-colors">{candidate.fullName}</h4>
                            <p className="text-[11px] text-[#637588] font-medium">{candidate.email}</p>
                        </div>
                    </div>
                    <button className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={20} /></button>
                </div>

                <div className="flex items-center gap-2">
                     <Badge variant="secondary" className="text-xs">{candidate.statusReason}</Badge>
                     {candidate.score && (
                        <Badge className={cn('flex items-center gap-1', stageColors[candidate.pipelineStatus]?.bg, stageColors[candidate.pipelineStatus]?.text)}>
                           <Star size={12} />
                           <span className="font-bold">{candidate.score}</span>
                       </Badge>
                     )}
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar size={14} /> Applied {isValid(appliedDate) ? formatDistanceToNow(appliedDate, { addSuffix: true }) : '...'}</span>
                </div>
            </CardContent>
        </Card>
    );
};

const KanbanColumnSkeleton = () => (
    <div className="flex flex-col min-w-[320px] w-[320px] h-full">
        <div className="flex items-center justify-between mb-4 px-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
        </div>
    </div>
);


interface KanbanBoardProps {
  candidates: Candidate[];
  isLoading: boolean;
  onStatusChange: (candidateId: string, newStatus: PipelineStatus) => void;
}


export function KanbanBoard({ candidates, isLoading, onStatusChange }: KanbanBoardProps) {
  const [dragOverStatus, setDragOverStatus] = useState<PipelineStatus | null>(null);

  const candidatesByStatus = useMemo(() => {
    const grouped = new Map<PipelineStatus, Candidate[]>();
    pipelineStages.forEach(stage => grouped.set(stage.status, []));

    candidates.forEach(candidate => {
      const stageKey = pipelineStages.find(s => s.status === candidate.pipelineStatus);
      if (stageKey) {
        const list = grouped.get(stageKey.status) || [];
        list.push(candidate);
        grouped.set(stageKey.status, list);
      }
    });
    return grouped;
  }, [candidates]);
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: PipelineStatus) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate && candidate.pipelineStatus !== status) {
        onStatusChange(candidateId, status);
    }
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Card>
        <CardContent className="p-0">
            <div className="kanban-board flex flex-1 overflow-x-auto p-6 gap-6 items-start">
            {isLoading ? (
                <>
                    <KanbanColumnSkeleton />
                    <KanbanColumnSkeleton />
                    <KanbanColumnSkeleton />
                </>
            ) : (
                pipelineStages.map(({ status, label }) => {
                    const columnCandidates = candidatesByStatus.get(status) || [];
                    const colorClasses = stageColors[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
                    return (
                    <div 
                        key={status} 
                        className={cn(
                            "flex flex-col min-w-[320px] w-[320px] h-full rounded-xl transition-colors p-2",
                             dragOverStatus === status ? 'bg-primary/5' : ''
                        )}
                        onDrop={(e) => handleDrop(e, status)}
                        onDragOver={handleDragOver}
                        onDragEnter={() => setDragOverStatus(status)}
                        onDragLeave={() => setDragOverStatus(null)}
                    >
                        <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#111418] dark:text-white uppercase tracking-wider">{label}</h3>
                            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', colorClasses.bg, colorClasses.text)}>{columnCandidates.length}</span>
                        </div>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-2">
                        {columnCandidates.map(candidate => (
                            <CandidateCard key={candidate.id} candidate={candidate} />
                        ))}
                        </div>
                    </div>
                    );
                })
            )}
            </div>
        </CardContent>
    </Card>
  );
}
