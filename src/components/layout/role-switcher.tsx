"use client";

import { useAuthContext } from "@/lib/auth";
import type { Role } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users } from "lucide-react";
import { Button } from "../ui/button";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

export function RoleSwitcher() {
  const { user, setUserRole } = useAuthContext();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="ghost"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full justify-start text-sm p-2 h-auto"
        >
            <Users size={16} /> Switch Role
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup
            value={user.role}
            onValueChange={(value) => setUserRole(value as Role)}
        >
            {roles.map((role) => (
            <DropdownMenuRadioItem key={role} value={role}>
                {role}
            </DropdownMenuRadioItem>
            ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
