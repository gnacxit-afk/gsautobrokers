
'use client';

import type { Appointment, Role, Staff, Lead } from '@/lib/types';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Users, ChevronsUpDown } from 'lucide-react';

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

interface AppointmentActionsProps {
  appointment: Appointment;
  userRole: Role;
  allStaff: Staff[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdateOwner: (leadId: string, newOwnerId: string) => void;
  onUpdateStage: (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => void;
}

export function AppointmentActions({ appointment, userRole, onEdit, onDelete, onUpdateOwner, onUpdateStage, allStaff }: AppointmentActionsProps) {

  const assignableStaff = allStaff.filter(
    (s) => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin'
  );

  const handleDeleteClick = () => {
      onDelete();
  };

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

          <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Users className="mr-2 h-4 w-4" />
                <span>Change Owner</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup 
                    value={appointment.ownerId} 
                    onValueChange={(newOwnerId) => onUpdateOwner(appointment.leadId, newOwnerId)}
                  >
                      {assignableStaff.map((staffMember) => (
                          <DropdownMenuRadioItem key={staffMember.id} value={staffMember.id}>{staffMember.name}</DropdownMenuRadioItem>
                      ))}
                  </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              <span>Update Stage</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <DropdownMenuRadioGroup 
                  value={appointment.stage} 
                  onValueChange={(stage) => onUpdateStage(appointment.leadId, appointment.stage, stage as Lead['stage'])}
                >
                    {leadStages.map((stage) => (
                      <DropdownMenuRadioItem key={stage} value={stage}>
                          {stage}
                      </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSeparator />

           <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Appointment
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={handleDeleteClick} className="text-destructive focus:text-destructive">
                        Confirm Deletion
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        Cancel
                    </DropdownMenuItem>
                </DropdownMenuSubContent>
            </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Supervisor sees only the delete option, now as a nested menu
  if (userRole === 'Supervisor') {
    return (
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                  <Trash2 size={16} />
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
              <DropdownMenuLabel>Delete Appointment?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleDeleteClick} className="text-destructive focus:text-destructive">
                  Confirm Deletion
              </DropdownMenuItem>
              <DropdownMenuItem>
                  Cancel
              </DropdownMenuItem>
          </DropdownMenuContent>
      </DropdownMenu>
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
