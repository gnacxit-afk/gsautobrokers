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
import { useCollection, useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

interface NewStaffDialogProps {
  children: React.ReactNode;
}

export function NewStaffDialog({ children }: NewStaffDialogProps) {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Omit<Staff, 'id' | 'hireDate' | 'avatarUrl'>>>({});
    const firestore = useFirestore();

    const { data: allStaff } = useCollection(firestore ? collection(firestore, 'staff') : null);
    
    const supervisors = useMemo(() => (allStaff as Staff[] || []).filter(s => s.role === 'Supervisor'), [allStaff]);
    const admins = useMemo(() => (allStaff as Staff[] || []).filter(s => s.role === 'Admin'), [allStaff]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: keyof Staff, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!firestore) return;

        if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.dui) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }

        try {
            await addDoc(collection(firestore, 'staff'), {
                ...formData,
                id: formData.dui, // Using DUI as ID
                hireDate: serverTimestamp(),
                avatarUrl: '', // Or a default avatar
            });

            toast({
                title: "Staff Member Added",
                description: "The new staff member has been registered.",
            });
            setOpen(false);
            setFormData({});
        } catch (error) {
            console.error("Error adding staff member: ", error);
            toast({
                title: "Error",
                description: "Could not add staff member.",
                variant: "destructive",
            });
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setFormData({});
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
                    <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                        Email
                    </Label>
                    <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dui" className="text-right">
                        DUI
                    </Label>
                    <Input id="dui" value={formData.dui || ''} onChange={handleChange} className="col-span-3" placeholder="00000000-0" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                        Password
                    </Label>
                    <Input id="password" type="password" value={formData.password || ''} onChange={handleChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                        Role
                    </Label>
                     <Select onValueChange={(value: Role) => handleSelectChange('role', value)} value={formData.role}>
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
                {formData.role === 'Broker' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="supervisor" className="text-right">
                            Supervisor
                        </Label>
                        <Select onValueChange={(value) => handleSelectChange('supervisorId', value)} value={formData.supervisorId}>
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
                 {formData.role === 'Supervisor' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="admin" className="text-right">
                            Reports to
                        </Label>
                        <Select onValueChange={(value) => handleSelectChange('supervisorId', value)} value={formData.supervisorId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select an admin" />
                            </SelectTrigger>
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
