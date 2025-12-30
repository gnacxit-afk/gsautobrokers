"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, ChevronDown, MessageSquare, Phone } from "lucide-react";
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
import type { Lead } from "@/lib/types";
import React from "react";
import { AnalyzeLeadDialog } from "./analyze-lead-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const leadStatuses: Lead['status'][] = ["New", "Contacted", "Qualified", "On the way", "On site", "Sale", "Closed", "Lost"];


const CellActions: React.FC<{ lead: Lead, onUpdateStatus: (id: string, status: Lead['status']) => void, onDelete: (id: string) => void, row: any }> = ({ lead, onUpdateStatus, onDelete, row }) => {
  const [isAnalyzeOpen, setAnalyzeOpen] = React.useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleStatusUpdate = (status: Lead['status']) => {
    onUpdateStatus(lead.id, status);
    toast({ title: "Status Updated", description: `Lead "${lead.name}" is now ${status}.` });
  };

  return (
    <>
      <AnalyzeLeadDialog open={isAnalyzeOpen} onOpenChange={setAnalyzeOpen} lead={lead} />
      <div className="flex items-center gap-2">
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
            {user.role === 'Admin' && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Update Status</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={lead.status} onValueChange={(status) => handleStatusUpdate(status as Lead['status'])}>
                        {leadStatuses.map((status) => (
                          <DropdownMenuRadioItem key={status} value={status}>
                            {status}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete(lead.id)}
            >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export const getColumns = (
  onUpdateStatus: (id: string, status: Lead['status']) => void,
  onDelete: (id: string) => void
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
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span>{lead.phone}</span>
            <a href={`tel:${lead.phone}`} className="text-blue-500 hover:text-blue-700">
              <Phone size={14} />
            </a>
          </div>
          <div className="text-xs opacity-60">{lead.email}</div>
        </div>
      );
    },
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
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
       const variant: "default" | "secondary" | "destructive" | "outline" =
        status === "Closed" || status === "Sale"
          ? "default"
          : status === "Lost"
          ? "destructive"
          : ["New", "Contacted", "Qualified"].includes(status)
          ? "secondary"
          : "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
   {
    accessorKey: "ownerName",
    header: "Owner",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
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
      return <CellActions lead={lead} onUpdateStatus={onUpdateStatus} onDelete={onDelete} row={row} />;
    },
  },
];
