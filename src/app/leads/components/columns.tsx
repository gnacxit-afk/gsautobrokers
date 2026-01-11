
"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, ChevronDown, Users, Star, ChevronsUpDown, FileText, Bot, Calendar as CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { Lead, NoteEntry, Staff } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/auth";
import { cn } from "@/lib/utils";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

// Props for the CellActions component
interface CellActionsProps {
  row: Row<Lead>;
  onUpdateStage: (lead: Lead, newStage: Lead['stage'], appointmentDate?: Date) => void;
  onDelete: (id: string) => void;
  onUpdateOwner: (leadId: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => void;
  staff: Staff[];
}

// **EXTRACTED CELLACTIONS COMPONENT**
const CellActions: React.FC<CellActionsProps> = ({ row, onUpdateStage, onDelete, onUpdateOwner, staff }) => {
  const lead = row.original;
  const { toast } = useToast();
  const { user } = useAuthContext();
  const router = useRouter();
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleStageUpdate = (stage: Lead['stage']) => {
    if (stage === 'Citado') {
        setIsCalendarOpen(true);
    } else {
        onUpdateStage(lead, stage);
        toast({ title: "Stage Updated", description: `Lead "${lead.name}" is now ${stage}.` });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
        setAppointmentDate(date);
        onUpdateStage(lead, 'Citado', date);
        toast({ title: "Stage Updated", description: `Lead "${lead.name}" scheduled for ${format(date, 'PPP')}.` });
        setIsCalendarOpen(false);
    }
  }
  
  const handleOwnerUpdate = (newOwnerId: string) => {
    const newOwner = staff.find(s => s.id === newOwnerId);
    if (newOwner) {
      onUpdateOwner(lead.id, lead.ownerName, newOwnerId, newOwner.name);
      toast({ title: "Owner Updated", description: `${lead.name} is now assigned to ${newOwner.name}.` });
    }
  }

  const assignableStaff = staff.filter(
    (s) => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin'
  );
  
  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                
                <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}/notes`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Notes / History</span>
                </DropdownMenuItem>

                <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}/analysis`)}>
                    <Bot className="mr-2 h-4 w-4" />
                    <span>AI Lead Analysis</span>
                </DropdownMenuItem>
                
                <DropdownMenuSub>
                    <PopoverTrigger asChild>
                        <DropdownMenuSubTrigger>
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
                            <span>Update Stage</span>
                        </DropdownMenuSubTrigger>
                    </PopoverTrigger>
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
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={appointmentDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export const getColumns = (
  onUpdateStage: (lead: Lead, newStage: Lead['stage'], appointmentDate?: Date) => void,
  onDelete: (id: string) => void,
  onUpdateOwner: (leadId: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => void,
  staff: Staff[]
): ColumnDef<Lead>[] => [
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
      const lead = row.original;
       const variant: "default" | "secondary" | "destructive" | "outline" =
        stage === "Ganado"
          ? "default"
          : stage === "Perdido"
          ? "destructive"
          : ["Nuevo", "Calificado", "Citado"].includes(stage)
          ? "secondary"
          : "outline";
      
      const appointmentDate = lead.appointmentDate ? 
        (lead.appointmentDate as any).toDate ? (lead.appointmentDate as any).toDate() : new Date(lead.appointmentDate as string) 
        : null;

      return (
        <div className="flex flex-col">
            <Badge variant={variant}>{stage}</Badge>
            {stage === 'Citado' && appointmentDate && isValid(appointmentDate) && (
                <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CalendarIcon size={12}/>
                    {format(appointmentDate, 'MMM d, yyyy')}
                </span>
            )}
        </div>
      )
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
        if (!isValid(date)) {
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
        onUpdateOwner={onUpdateOwner}
        staff={staff}
      />;
    },
  },
];
