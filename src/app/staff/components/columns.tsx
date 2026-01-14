

'use client';

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Trash2, ArrowUpDown } from "lucide-react";
import Link from 'next/link';

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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Staff, Role } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


const roleColors: Record<Role, string> = {
  Admin: 'bg-red-100 text-red-700 border-red-200',
  Supervisor: 'bg-blue-100 text-blue-700 border-blue-200',
  Broker: 'bg-slate-100 text-slate-700 border-slate-200',
};


interface GetColumnsProps {
  onDelete: (id: string, name: string) => void;
  isMasterAdmin: boolean;
  allStaff: Staff[];
}

export const getColumns = ({ onDelete, isMasterAdmin, allStaff }: GetColumnsProps): ColumnDef<Staff>[] => [
    {
      accessorKey: "name",
      header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-slate-100 text-slate-500 font-semibold">
                    {getAvatarFallback(staff.name)}
                </AvatarFallback>
            </Avatar>
            <div>
                <p className="font-bold">{staff.name}</p>
                <p className="text-xs text-muted-foreground">{staff.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as Role;
        return <Badge className={roleColors[role]}>{role}</Badge>;
      },
       filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
        accessorKey: 'supervisorId',
        header: 'Supervisor',
        cell: ({ row }) => {
            const staff = row.original;
            const supervisor = allStaff.find(s => s.id === staff.supervisorId);
            return supervisor?.name || 'N/A';
        }
    },
    {
        accessorKey: "dui",
        header: "DUI",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="text-right">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/crm/staff/${staff.id}`}>View/Edit Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 {isMasterAdmin && staff.email !== 'gnacxit@gmail.com' && (
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                           Delete Profile
                         </DropdownMenuItem>
                       </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the profile for <span className="font-bold">{staff.name}</span> and reassign their leads.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(staff.id, staff.name)} className="bg-destructive hover:bg-destructive/90">
                              Yes, delete profile
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                 )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
];

    