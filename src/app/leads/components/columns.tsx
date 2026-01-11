
"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Users, ChevronsUpDown, FileText, Bot, Calendar } from "lucide-react";
import { format, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Link from 'next/link';

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
import type { Lead, NoteEntry, Staff } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/auth";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

// Props for the CellActions component
interface CellActionsProps {
  row: Row<Lead>;
  onUpdateStage: (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => void;
  onDelete: (id: string) => void;
  onUpdateOwner: (leadId: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => void;
  staff: Staff[];
}

const CellActions: React.FC<CellActionsProps> = ({ row, onUpdateStage, onDelete, onUpdateOwner, staff }) => {
  const lead = row.original;
  const { toast } = useToast();
  const { user } = useAuthContext();
  const router = useRouter();
  
  const handleStageUpdate = (newStage: Lead['stage']) => {
    onUpdateStage(lead.id, lead.stage, newStage);
  };
  
  const handleOwnerUpdate = (newOwnerId: string) => {
    const newOwner = staff.find(s => s.id === newOwnerId);
    if (newOwner) {
      onUpdateOwner(lead.id, lead.ownerName, newOwnerId, newOwner.name);
      toast({ title: "Owner Updated", description: `${lead.name} is now assigned to ${newOwner.name}.` });
    }
  };

  const assignableStaff = staff.filter(
    (s) => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin'
  );
  
  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => router.push(`/leads/${lead.id}/notes`)}>
          Details
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
            
            <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}/notes`)}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Details / Notes</span>
            </DropdownMenuItem>

             <DropdownMenuItem onSelect={() => router.push(`/appointments`)}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Schedule Appointment</span>
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}/analysis`)}>
                <Bot className="mr-2 h-4 w-4" />
                <span>AI Lead Analysis</span>
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
  onUpdateStage: (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => void,
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
        <Link href={`/leads/${lead.id}/notes`} className="hover:underline font-bold text-slate-800">
            {lead.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="text-sm">
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
      return <span>{channel}</span>;
    },
     filterFn: 'equalsString',
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const stage = row.getValue("stage") as string;
      return <span>{stage}</span>;
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
            <div className="text-xs">
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
