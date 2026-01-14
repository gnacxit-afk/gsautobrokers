'use client';

import type { Appointment, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';


interface AppointmentActionsProps {
  appointment: Appointment;
  userRole: Role;
  onEdit: () => void;
  onDelete: () => void;
  onChangeOwner: () => void;
}

export function AppointmentActions({ appointment, userRole, onEdit, onDelete, onChangeOwner }: AppointmentActionsProps) {

  // Admin sees a dropdown with all options
  if (userRole === 'Admin') {
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
          <DropdownMenuItem onSelect={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Date/Time</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onChangeOwner}>
            <Users className="mr-2 h-4 w-4" />
            <span>Change Owner</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
             <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Appointment
                </DropdownMenuItem>
             </AlertDialogTrigger>
             <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This action cannot be undone. This will cancel the appointment for <span className="font-bold">{appointment.leadName}</span>.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                          Yes, cancel appointment
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Supervisor sees only the delete option
  if (userRole === 'Supervisor') {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
            <Trash2 size={16} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will cancel the appointment for <span className="font-bold">{appointment.leadName}</span> and change the lead's stage to "En Seguimiento".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  // Broker sees only the edit button
  if (userRole === 'Broker') {
    return (
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Edit size={16} className="mr-2 h-4 w-4" /> Edit
      </Button>
    );
  }
  
  return null;
}
