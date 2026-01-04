
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, ChevronDown, MessageSquare, Users, Star } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Lead, Staff } from "@/lib/types";
import React from "react";
import { AnalyzeLeadDialog } from "./analyze-lead-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ChangeOwnerDialog } from "./change-owner-dialog";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const leadStatuses: NonNullable<Lead['leadStatus']>[] = ["Hot Lead", "Warm Lead", "In Nurturing", "Cold Lead"];


const CellActions: React.FC<{ lead: Lead, onUpdateStage: (id: string, stage: Lead['stage']) => void, onDelete: (id: string) => void, onUpdateOwner: (id: string, newOwner: Staff) => void, onUpdateLeadStatus: (id: string, leadStatus: NonNullable<Lead['leadStatus']>) => void, staff: Staff[], row: any }> = ({ lead, onUpdateStage, onDelete, onUpdateOwner, onUpdateLeadStatus, staff, row }) => {
  const [isAnalyzeOpen, setAnalyzeOpen] = React.useState(false);
  const [isChangeOwnerOpen, setChangeOwnerOpen] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const handleStageUpdate = (stage: Lead['stage']) => {
    onUpdateStage(lead.id, stage);
    toast({ title: "Stage Updated", description: `Lead "${lead.name}" is now ${stage}.` });
  };

  const handleLeadStatusUpdate = (status: NonNullable<Lead['leadStatus']>) => {
    onUpdateLeadStatus(lead.id, status);
    toast({ title: "Lead Status Updated", description: `Lead "${lead.name}" status is now ${status}.` });
  };
  
  return (
    <>
      <AnalyzeLeadDialog open={isAnalyzeOpen} onOpenChange={setAnalyzeOpen} lead={lead} />
      <ChangeOwnerDialog
        lead={lead}
        staff={staff}
        open={isChangeOwnerOpen}
        onOpenChange={setChangeOwnerOpen}
        onUpdateOwner={onUpdateOwner}
      />
      <div className="flex items-center gap-2 justify-end">
        <Button
            onClick={() => row.toggleExpanded()}
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            >
            {row.getIsExpanded() ? <ChevronDown size={16} /> : <MessageSquare size={16} />}
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setAnalyzeOpen(true)}>Analyze Lead (AI)</DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>Update Stage</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={lead.stage} onValueChange={(stage) => handleStageUpdate(stage as Lead['stage'])}>
                    {leadStages.map((stage) => (
                      <DropdownMenuRadioItem key={stage} value={stage}>
                        {stage}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>Update Lead Status</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={lead.leadStatus} onValueChange={(status) => handleLeadStatusUpdate(status as NonNullable<Lead['leadStatus']>)}>
                    {leadStatuses.map((status) => (
                      <DropdownMenuRadioItem key={status} value={status}>
                        {status}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            
            {user?.role === 'Admin' && (
                <DropdownMenuItem onSelect={() => setChangeOwnerOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Change Owner</span>
                </DropdownMenuItem>
              )}

            {user?.role === 'Admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => onDelete(lead.id)}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                </DropdownMenuItem>
              </>
            )}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export const getColumns = (
  onUpdateStage: (id: string, stage: Lead['stage']) => void,
  onDelete: (id: string) => void,
  onUpdateOwner: (id: string, newOwner: Staff) => void,
  onUpdateLeadStatus: (id: string, leadStatus: NonNullable<Lead['leadStatus']>) => void,
  staff: Staff[]
): ColumnDef<Lead>[] => [
  {
    accessorKey: "leadStatus",
    header: "Lead Status",
    cell: ({ row }) => {
      const leadStatus = row.getValue("leadStatus") as Lead['leadStatus'];
      if (!leadStatus) return <Badge variant="outline">Not Analyzed</Badge>;
      
      const badgeStyle: React.CSSProperties = 
         leadStatus === "Warm Lead" ? { backgroundColor: 'hsl(48, 95%, 95%)', color: 'hsl(40, 90%, 50%)', borderColor: 'hsl(48, 90%, 85%)' } :
         leadStatus === "In Nurturing" ? { backgroundColor: 'hsl(145, 85%, 96%)', color: 'hsl(145, 63%, 42%)', borderColor: 'hsl(145, 70%, 88%)' } :
         leadStatus === "Cold Lead" ? { backgroundColor: 'hsl(210, 100%, 97%)', color: 'hsl(210, 80%, 55%)', borderColor: 'hsl(210, 90%, 88%)' } :
         {};

      return <Badge 
        variant={leadStatus === "Hot Lead" ? "destructive" : "outline"}
        style={badgeStyle}
        className={cn("flex gap-1.5 items-center whitespace-nowrap", leadStatus === "Hot Lead" ? "" : "border")}
      >
        <Star className={cn("w-3 h-3", 
          leadStatus === "Hot Lead" ? "text-red-500" :
          leadStatus === "Warm Lead" ? "text-yellow-500" :
          leadStatus === "In Nurturing" ? "text-green-500" :
          "text-blue-500"
        )} />
        <span>{leadStatus}</span>
      </Badge>
    },
    filterFn: 'equalsString',
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div>
          <div className="font-bold text-slate-800">{lead.name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="text-sm text-slate-600">
          <div>{lead.phone}</div>
          <div className="text-xs opacity-60">{lead.email}</div>
        </div>
      );
    },
    enableGlobalFilter: true,
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => {
      const channel = row.getValue("channel") as string;
      return (
        <Badge variant="outline" className="text-xs uppercase font-bold">
          {channel}
        </Badge>
      );
    },
     filterFn: 'equalsString',
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const stage = row.getValue("stage") as string;
       const variant: "default" | "secondary" | "destructive" | "outline" =
        stage === "Ganado"
          ? "default"
          : stage === "Perdido"
          ? "destructive"
          : ["Nuevo", "Calificado", "Citado"].includes(stage)
          ? "secondary"
          : "outline";
      return <Badge variant={variant}>{stage}</Badge>;
    },
    filterFn: 'equalsString',
  },
   {
    accessorKey: "ownerName",
    header: "Owner",
    filterFn: 'equalsString',
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
        const dateRaw = row.getValue("createdAt");
        if (!dateRaw) return null;
        
        const date = (dateRaw as any).toDate ? (dateRaw as any).toDate() : new Date(dateRaw as string);
        
        return (
            <div className="text-xs text-slate-500">
                <div>{format(date, 'MMM d, yyyy')}</div>
                <div className="opacity-70">{format(date, 'h:mm a')}</div>
            </div>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original;
      return <CellActions lead={lead} onUpdateStage={onUpdateStage} onDelete={onDelete} onUpdateOwner={onUpdateOwner} onUpdateLeadStatus={onUpdateLeadStatus} staff={staff} row={row} />;
    },
  },
];

    
