
"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, ChevronDown, MessageSquare, Users, Star, ChevronsUpDown } from "lucide-react";
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
import { AddNoteDialog } from "./add-note-dialog";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];
const leadStatuses: NonNullable<Lead['leadStatus']>[] = ["Hot Lead", "Warm Lead", "In Nurturing", "Cold Lead"];

// Props for the CellActions component
interface CellActionsProps {
  row: Row<Lead>;
  onUpdateStage: (id: string, stage: Lead['stage']) => void;
  onDelete: (id: string) => void;
  onUpdateLeadStatus: (id: string, leadStatus: NonNullable<Lead['leadStatus']>) => void;
  onUpdateOwner: (leadId: string, newOwnerId: string) => void;
  onAddNote: (leadId: string, noteContent: string, noteType: 'Manual' | 'AI Analysis' | 'System') => void;
  staff: Staff[];
}

// **EXTRACTED CELLACTIONS COMPONENT**
// Moved outside of getColumns to prevent re-creation on every render.
const CellActions: React.FC<CellActionsProps> = ({ row, onUpdateStage, onDelete, onUpdateLeadStatus, onUpdateOwner, onAddNote, staff }) => {
  const lead = row.original;
  const [isAnalyzeOpen, setAnalyzeOpen] = React.useState(false);
  const [isAddNoteOpen, setAddNoteOpen] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuthContext();

  const handleStageUpdate = (stage: Lead['stage']) => {
    onUpdateStage(lead.id, stage);
    toast({ title: "Stage Updated", description: `Lead "${lead.name}" is now ${stage}.` });
  };
  
  const handleLeadStatusUpdate = (status: NonNullable<Lead['leadStatus']>) => {
    onUpdateLeadStatus(lead.id, status);
  };

  const handleOwnerUpdate = (newOwnerId: string) => {
    onUpdateOwner(lead.id, newOwnerId);
  }

  const handleManualNoteAdd = (leadId: string, noteContent: string) => {
    onAddNote(leadId, noteContent, 'Manual');
  }

  const handleAINoteAdd = (leadId: string, noteContent: string) => {
    onAddNote(leadId, noteContent, 'AI Analysis');
  }

  const assignableStaff = staff.filter(
    (s) => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin'
  );
  
  return (
    <>
      <AnalyzeLeadDialog 
        open={isAnalyzeOpen} 
        onOpenChange={setAnalyzeOpen} 
        lead={lead} 
        onAnalysisComplete={handleLeadStatusUpdate} 
        onAddNote={handleAINoteAdd}
      />
      <AddNoteDialog 
        open={isAddNoteOpen}
        onOpenChange={setAddNoteOpen}
        leadId={lead.id}
        onAddNote={handleManualNoteAdd}
      />
      <div className="flex items-center gap-2 justify-end">
        <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => row.toggleExpanded(!row.getIsExpanded())}
        >
            <MessageSquare size={14} />
            Notes ({lead.notes?.length || 0})
            <ChevronDown
                size={14}
                className={cn("transition-transform", row.getIsExpanded() && 'rotate-180')}
            />
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
            <DropdownMenuItem onSelect={() => setAddNoteOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" /> Add Note
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAnalyzeOpen(true)}>
                <Star className="mr-2 h-4 w-4" /> Analyze Lead (AI)
            </DropdownMenuItem>
            
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <ChevronsUpDown className="mr-2 h-4 w-4" />
                    <span>Update Stage</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={lead.stage} onValueChange={(stage) => handleStageUpdate(stage as Lead['stage'])}>
                        {leadStages.map((stage) => (
                        <DropdownMenuRadioItem key={stage} value={stage}>
                            {stage}
                        </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuSub>

            {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Change Owner</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={lead.ownerId} onValueChange={handleOwnerUpdate}>
                          {assignableStaff.map((staffMember) => (
                              <DropdownMenuRadioItem key={staffMember.id} value={staffMember.id}>
                                  {staffMember.name}
                              </DropdownMenuRadioItem>
                          ))}
                      </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
            )}

            {user?.role === 'Admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onSelect={() => onDelete(lead.id)}
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
  onUpdateLeadStatus: (id: string, leadStatus: NonNullable<Lead['leadStatus']>) => void,
  onUpdateOwner: (leadId: string, newOwnerId: string) => void,
  onAddNote: (leadId: string, noteContent: string, noteType: 'Manual' | 'AI Analysis' | 'System') => void,
  staff: Staff[]
): ColumnDef<Lead>[] => [
  {
    accessorKey: "leadStatus",
    header: "Lead Status",
    cell: ({ row }) => {
      const leadStatus = row.getValue("leadStatus") as Lead['leadStatus'];
      if (!leadStatus) return <Badge variant="outline">Not Analyzed</Badge>;
      
      return <Badge 
        variant={leadStatus === "Hot Lead" ? "destructive" : "outline"}
        className={cn("flex gap-1.5 items-center whitespace-nowrap",
          leadStatus === "Hot Lead" ? "" : "border",
          leadStatus === "Warm Lead" ? "bg-amber-50 text-amber-700 border-amber-200" : "",
          leadStatus === "In Nurturing" ? "bg-green-50 text-green-700 border-green-200" : "",
          leadStatus === "Cold Lead" ? "bg-blue-50 text-blue-700 border-blue-200" : ""
        )}
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
        
        // Convert Firestore Timestamp to JS Date if necessary
        const date = (dateRaw as any).toDate ? (dateRaw as any).toDate() : new Date(dateRaw as string);
        
        // Check for invalid date
        if (isNaN(date.getTime())) {
          return <div className="text-xs text-slate-500">Invalid date</div>;
        }

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
      // Pass all required props to the stable CellActions component
      return <CellActions 
        row={row} 
        onUpdateStage={onUpdateStage} 
        onDelete={onDelete} 
        onUpdateLeadStatus={onUpdateLeadStatus} 
        onUpdateOwner={onUpdateOwner}
        onAddNote={onAddNote}
        staff={staff}
      />;
    },
  },
];

    