"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/lib/types";
import React from "react";
import { AnalyzeLeadDialog } from "./analyze-lead-dialog";
import { useToast } from "@/hooks/use-toast";

const CellActions: React.FC<{ lead: Lead, onUpdateStatus: (id: string, status: Lead['status']) => void, onDelete: (id: string) => void }> = ({ lead, onUpdateStatus, onDelete }) => {
  const [isAnalyzeOpen, setAnalyzeOpen] = React.useState(false);
  const { toast } = useToast();

  const handleStatusToggle = () => {
    const newStatus = lead.status === "Closed" ? "New" : "Closed";
    onUpdateStatus(lead.id, newStatus);
    toast({ title: "Status Updated", description: `Lead "${lead.name}" is now ${newStatus}.` });
  };

  return (
    <>
      <AnalyzeLeadDialog open={isAnalyzeOpen} onOpenChange={setAnalyzeOpen} lead={lead} />
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
          <DropdownMenuItem onClick={handleStatusToggle}>
            Mark as {lead.status === "Closed" ? "New" : "Closed"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={() => onDelete(lead.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const getColumns = (
  onUpdateStatus: (id: string, status: Lead['status']) => void,
  onDelete: (id: string) => void
): ColumnDef<Lead>[] => [
  {
    accessorKey: "name",
    header: "Customer / Company",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div>
          <div className="font-bold text-slate-800">{lead.name}</div>
          <div className="text-xs text-slate-400">{lead.company || 'Individual'}</div>
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
          <div>{lead.phone}</div>
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
        status === "Closed"
          ? "default"
          : status === "Lost"
          ? "destructive"
          : status === "New"
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
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original;
      return <CellActions lead={lead} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />;
    },
  },
];
