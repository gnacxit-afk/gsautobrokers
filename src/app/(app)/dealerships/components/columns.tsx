'use client';

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dealership } from "@/lib/types";

interface ColumnActionsProps {
  dealership: Dealership;
  onEdit: (dealership: Dealership) => void;
  onDelete: (dealershipId: string) => void;
}

const ColumnActions: React.FC<ColumnActionsProps> = ({ dealership, onEdit, onDelete }) => {
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
        <DropdownMenuItem onSelect={() => onEdit(dealership)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onDelete(dealership.id)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getColumns = ({ onEdit, onDelete }: { onEdit: (dealership: Dealership) => void; onDelete: (dealershipId: string) => void; }): ColumnDef<Dealership>[] => [
  {
    accessorKey: "name",
    header: "Dealership Name",
  },
  {
    accessorKey: "pocName",
    header: "Point of Contact",
    cell: ({ row }) => row.original.pocName || 'N/A',
  },
  {
    accessorKey: "pocEmail",
    header: "Contact Email",
     cell: ({ row }) => row.original.pocEmail || 'N/A',
  },
  {
    accessorKey: "commission",
    header: "Commission ($)",
    cell: ({ row }) => {
        const commission = row.original.commission;
        return commission !== undefined ? `$${commission.toLocaleString()}` : 'N/A';
    },
  },
  {
    accessorKey: "dealershipCode",
    header: "Code",
    cell: ({ row }) => row.original.dealershipCode || 'N/A',
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const dealership = row.original;
      return <ColumnActions dealership={dealership} onEdit={onEdit} onDelete={onDelete} />;
    },
  },
];
