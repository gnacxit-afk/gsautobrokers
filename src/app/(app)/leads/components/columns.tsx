"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Users, ChevronsUpDown, FileText, Bot, Calendar, Building, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import React from "react";
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
import type { Lead, Staff, Dealership } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

const stageColors: Record<Lead['stage'], string> = {
  "Nuevo": "bg-gray-100 text-gray-800 border-gray-200",
  "Calificado": "bg-blue-100 text-blue-800 border-blue-200",
  "Citado": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "En Seguimiento": "bg-orange-100 text-orange-800 border-orange-200",
  "Ganado": "bg-green-100 text-green-800 border-green-200",
  "Perdido": "bg-red-100 text-red-800 border-red-200",
};

interface CellActionsProps {
  row: Row<Lead>;
  onUpdateStage: (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => void;
  onDelete: (id: string) => void;
  onUpdateOwner: (leadId: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => void;
  onUpdateDealership: (leadId: string, newDealershipId: string) => void;
  onSendWhatsapp: (lead: Lead) => void;
  staff: Staff[];
  dealerships: Dealership[];
}

const CellActions: React.FC<CellActionsProps> = ({ row, onUpdateStage, onDelete, onUpdateOwner, onUpdateDealership, onSendWhatsapp, staff, dealerships }) => {
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
    }
  };

  const handleDealershipUpdate = (newDealershipId: string) => {
    onUpdateDealership(lead.id, newDealershipId);
  };

  const assignableStaff = staff.filter(
    (s) => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin'
  );
  
  return (
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

          <DropdownMenuItem onSelect={() => onSendWhatsapp(lead)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Send WhatsApp</span>
          </DropdownMenuItem>

           <DropdownMenuItem onSelect={() => router.push(`/appointments?leadId=${lead.id}`)}>
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
                    {leadStages.map((stage) => {
                        const isBrokerRestricted = user?.role === 'Broker' && (stage === 'Ganado' || stage === 'Perdido');
                        return (
                          <DropdownMenuRadioItem key={stage} value={stage} disabled={isBrokerRestricted}>
                              {stage}
                          </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Change Owner</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={lead.ownerId} onValueChange={handleOwnerUpdate}>
                        {assignableStaff.map((staffMember) => (
                            <DropdownMenuRadioItem key={staffMember.id} value={staffMember.id}>{staffMember.name}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building className="mr-2 h-4 w-4" />
                  <span>Change Dealership</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={lead.dealershipId} onValueChange={handleDealershipUpdate}>
                        {dealerships.map((dealership) => (
                            <DropdownMenuRadioItem key={dealership.id} value={dealership.id}>{dealership.name}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
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
  );
};

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export const getColumns = (
  onUpdateStage: (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => void,
  onDelete: (id: string) => void,
  onUpdateOwner: (leadId: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => void,
  onUpdateDealership: (leadId: string, newDealershipId: string) => void,
  onSendWhatsapp: (lead: Lead) => void,
  staff: Staff[],
  dealerships: Dealership[]
): ColumnDef<Lead>[] => [
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const lead = row.original;
      return (
         <div className="flex flex-col">
            <Link href={`/leads/${lead.id}/notes`} className="hover:underline font-bold text-slate-800">
                {lead.name}
            </Link>
            <span className="text-xs text-slate-500">{lead.phone}</span>
             <span className="text-xs text-slate-400">{lead.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "ownerName",
    header: "Owner",
    cell: ({row}) => {
        const lead = row.original;
        return (
            <div className="flex items-center gap-2">
                 <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600 font-semibold">
                        {getAvatarFallback(lead.ownerName)}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{lead.ownerName}</span>
            </div>
        )
    },
    filterFn: 'equalsString',
  },
  {
    accessorKey: "dealershipName",
    header: "Dealership",
    cell: ({ row }) => {
      const dealershipName = row.getValue("dealershipName") as string;
      return <Badge variant="secondary">{dealershipName}</Badge>;
    },
    filterFn: 'equalsString',
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => {
      const channel = row.getValue("channel") as string;
      return <Badge variant="outline" className="capitalize">{channel}</Badge>;
    },
    filterFn: 'equalsString',
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      const stage = row.getValue("stage") as Lead['stage'];
      return <Badge className={cn("text-xs", stageColors[stage])}>{stage}</Badge>;
    },
    filterFn: 'equalsString',
  },
  {
    accessorKey: "lastActivity",
    header: "Last Activity",
    cell: ({ row }) => {
        const dateRaw = row.getValue("lastActivity") || row.original.createdAt;
        if (!dateRaw) return <span className="text-xs text-slate-400">No activity</span>;
        
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
    id: "actions",
    cell: ({ row }) => {
      return <CellActions 
        row={row} 
        onUpdateStage={onUpdateStage}
        onDelete={onDelete} 
        onUpdateOwner={onUpdateOwner}
        onUpdateDealership={onUpdateDealership}
        onSendWhatsapp={onSendWhatsapp}
        staff={staff}
        dealerships={dealerships}
      />;
    },
  },
];
