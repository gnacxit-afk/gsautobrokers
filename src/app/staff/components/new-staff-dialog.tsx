"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo } from "react";
import type { Role, Staff } from "@/lib/types";
import { getStaff } from "@/lib/mock-data";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

export function NewStaffDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const [selectedRole, setSelectedRole] = useState<Role | "">("");

    const allStaff = useMemo(() => getStaff(), []);
    
    const supervisors = useMemo(() => allStaff.filter(s => s.role === 'Supervisor'), [allStaff]);
    const admins = useMemo(() => allStaff.filter(s => s.role === 'Admin'), [allStaff]);

    const handleSave = () => {
        toast({
            title: "Staff Member Added",
            description: "The new staff member has been registered.",
        });
        setOpen(false);
        setSelectedRole("");
    }
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setSelectedRole("");
        }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                    Fill in the details to register a new staff member.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Full Name
                    </Label>
                    <Input id="name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                        Email
                    </Label>
                    <Input id="email" type="email" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dui" className="text-right">
                        DUI
                    </Label>
                    <Input id="dui" className="col-span-3" placeholder="00000000-0" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                        Password
                    </Label>
                    <Input id="password" type="password" className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                        Role
                    </Label>
                     <Select onValueChange={(value: Role) => setSelectedRole(value)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedRole === 'Broker' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supervisor" className="text-right">
                            Supervisor
                        </Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a supervisor" />
                            </SelectTrigger>
                            <SelectContent>
                                {supervisors.map(supervisor => (
                                    <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                 {selectedRole === 'Supervisor' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin" className="text-right">
                            Reports to
                        </Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select an admin" />
                            </Trigger>
                            <SelectContent>
                                {admins.map(admin => (
                                    <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleSave}>Save Staff</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
