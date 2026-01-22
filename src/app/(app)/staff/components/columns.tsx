"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { format, isValid } from "date-fns";
import { useRouter } from "next/navigation";
import React from "react";

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
import type { Staff } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CellActionsProps {
  staffMember: Staff;
  onConfirmDelete: (staff: Staff) => void;
  isMasterAdmin: boolean;
  allStaff: Staff[];
}

const getAvatarFallback = (name: string) => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const CellActions: React.FC<CellActionsProps> = ({ staffMember, onConfirmDelete, isMasterAdmin, allStaff }) => {
  const router = useRouter();

  const isEditingMasterAdmin = isMasterAdmin && staffMember.email === 'gnacxit@gmail.com';
  
  const supervisorName = staffMember.supervisorId 
    ? allStaff.find(s => s.id === staffMember.supervisorId)?.name 
    : 'N/A';

  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => router.push(`/staff/${staffMember.id}`)}>
        <Edit className="mr-2 h-4 w-4" />
        Edit
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
          <DropdownMenuItem onSelect={() => router.push(`/staff/${staffMember.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            View/Edit Profile
          </DropdownMenuItem>
          {isMasterAdmin && !isEditingMasterAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => onConfirmDelete(staffMember)}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const getColumns = ({ onConfirmDelete, isMasterAdmin, allStaff }: { onConfirmDelete: (staff: Staff) => void; isMasterAdmin: boolean; allStaff: Staff[] }): ColumnDef<Staff>[] => [
  {
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => {
      const staffMember = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{getAvatarFallback(staffMember.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold">{staffMember.name}</span>
            <span className="text-xs text-muted-foreground">{staffMember.email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return <Badge variant="outline">{role}</Badge>;
    },
  },
  {
    accessorKey: 'supervisorId',
    header: 'Supervisor',
    cell: ({ row }) => {
        const supervisorId = row.original.supervisorId;
        if (!supervisorId) return <span className="text-muted-foreground">N/A</span>;
        const supervisor = allStaff.find(s => s.id === supervisorId);
        return supervisor ? supervisor.name : 'Unknown';
    }
  },
  {
    accessorKey: "hireDate",
    header: "Hire Date",
    cell: ({ row }) => {
      const dateRaw = row.getValue("hireDate");
      if (!dateRaw) return 'N/A';
      const date = (dateRaw as any).toDate ? (dateRaw as any).toDate() : new Date(dateRaw as string);
      return isValid(date) ? format(date, 'MMM d, yyyy') : 'Invalid Date';
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <CellActions
          staffMember={row.original}
          onConfirmDelete={onConfirmDelete}
          isMasterAdmin={isMasterAdmin}
          allStaff={allStaff}
        />
      );
    },
  },
];
