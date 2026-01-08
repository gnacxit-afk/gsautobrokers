
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
import React, { useState, useMemo, useEffect } from "react";
import type { Role, Staff } from "@/lib/types";
import { useFirestore, useCollection } from "@/firebase";
import { collection, serverTimestamp, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

interface NewStaffDialogProps {
  children: React.ReactNode;
}

export function NewStaffDialog({ children }: NewStaffDialogProps) {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState<Partial<Omit<Staff, 'id'>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const firestore = useFirestore();
    
    const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
    const { data: allStaff } = useCollection<Staff>(staffQuery);
    
    const supervisors = useMemo(() => allStaff?.filter(s => s.role === 'Supervisor') || [], [allStaff]);
    const admins = useMemo(() => allStaff?.filter(s => s.role === 'Admin') || [], [allStaff]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, value } = e.target;
      setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: keyof Omit<Staff, 'id'>, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!firestore) return;

        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            toast({
                title: "Missing Fields",
                description: "Please fill all required fields.",
                variant: "destructive",
            });
            return;
        }

        const secondaryAppName = `newUserApp-${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
            const user = userCredential.user;

            const staffCollectionRef = collection(firestore, 'staff');
            const newDocRef = await addDoc(staffCollectionRef, {
                authUid: user.uid,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                supervisorId: formData.supervisorId || '',
                createdAt: serverTimestamp(),
                dui: formData.dui || '',
                avatarUrl: '', 
                hireDate: serverTimestamp()
            });

            toast({
                title: "Staff Member Added",
                description: "The new staff member has been registered.",
            });
            setOpen(false);
            setFormData({});
        } catch (error: any) {
            console.error("Error adding staff member: ", error);
             if (error.code === 'auth/email-already-in-use') {
                toast({
                    title: "Registration Failed",
                    description: "This email address is already registered. Please use a different email.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: error.message || "Could not add staff member.",
                    variant: "destructive",
                });
            }
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) setFormData({});
        }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                    Fill in the details to register a new staff member. An ID will be generated automatically.
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
                    <Label htmlFor="dui" className="text-right">
                        DUI
                    </Label>
                    <Input id="dui" value={formData.dui || ''} onChange={handleChange} className="col-span-3" placeholder="00000000-0" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                        Email
                    </Label>
                    <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                        Password
                    </Label>
                    <div className="col-span-3 relative">
                        <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            value={formData.password || ''} 
                            onChange={handleChange} 
                            className="pr-10"
                        />
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                    </div>
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
                        <Label htmlFor="supervisorId" className="text-right">
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
                        <Label htmlFor="supervisorId" className="text-right">
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
