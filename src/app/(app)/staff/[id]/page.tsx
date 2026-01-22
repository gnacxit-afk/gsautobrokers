

'use client';

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Staff, Role } from "@/lib/types";
import { useUser, useAuth, useDoc, useCollection } from "@/firebase";
import { AccessDenied } from "@/components/access-denied";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserCircle2, Eye, EyeOff, Trash2 } from "lucide-react";
import { useFirestore } from "@/firebase";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "firebase/auth";
import { useAuthContext } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


export default function StaffProfilePage() {
  const { user, loading: isUserLoading, MASTER_ADMIN_EMAIL } = useAuthContext();
  const auth = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const staffId = params.id as string;
  const firestore = useFirestore();
  
  const staffDocRef = useMemo(() => (firestore && staffId) ? doc(firestore, 'staff', staffId) : null, [firestore, staffId]);
  const { data: staffMember, loading: staffMemberLoading } = useDoc<Staff>(staffDocRef);

  const allStaffCollectionRef = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: allStaff, loading: allStaffLoading } = useCollection<Staff>(allStaffCollectionRef);

  const [formData, setFormData] = useState<Partial<Staff>>({});
  
  useEffect(() => {
    if (staffMember) {
        setFormData(staffMember);
    }
  }, [staffMember]);


  const supervisors = useMemo(() => allStaff?.filter(s => s.role === 'Supervisor') || [], [allStaff]);
  const admins = useMemo(() => allStaff?.filter(s => s.role === 'Admin') || [], [allStaff]);
  const managers = useMemo(() => allStaff?.filter(s => s.role === 'Supervisor' || s.role === 'Admin') || [], [allStaff]);


  const currentUserCanEdit = user?.role === 'Admin';
  const isEditingSelf = user?.id === staffId;
  const isEditingMasterAdmin = formData.email === MASTER_ADMIN_EMAIL;


  if (isUserLoading || staffMemberLoading || allStaffLoading) {
    return (
        <main className="flex flex-1 flex-col gap-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-6 w-48" />
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div>
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </main>
    )
  }
  
  if (!user || !currentUserCanEdit) {
    return <AccessDenied />;
  }


  if (!staffMember) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <p>Staff member not found.</p>
        </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (role: Role) => {
    // Prevent changing Master Admin's role
    if (isEditingMasterAdmin) {
        toast({ title: "Action Forbidden", description: "The Master Admin's role cannot be changed.", variant: "destructive" });
        return;
    }
    setFormData(prev => ({ ...prev, role }));
  };

   const handleSupervisorChange = (supervisorId: string) => {
    setFormData(prev => ({ ...prev, supervisorId }));
  };

  const handleSaveChanges = async () => {
    if (!firestore || !staffId) return;
    const staffDocRef = doc(firestore, 'staff', staffId);
    try {
        const { password, id, authUid, createdAt, hireDate, email, ...updateData } = formData;
        
        await updateDoc(staffDocRef, updateData);
        
        toast({
            title: "Profile Updated",
            description: `Details for ${formData.name} have been updated.`,
        });

    } catch (error) {
        toast({
            title: "Update Failed",
            description: "Could not save changes.",
            variant: "destructive",
        });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !staffId || !allStaff) return;
    const staffDocRef = doc(firestore, 'staff', staffId);
    
    if (isEditingMasterAdmin) {
        toast({ title: "Action Forbidden", description: "The Master Admin account cannot be deleted.", variant: "destructive" });
        return;
    }

    try {
      const masterAdmin = allStaff.find(s => s.email === MASTER_ADMIN_EMAIL);
      if (!masterAdmin) {
        throw new Error("Master Admin account not found.");
      }

      const leadsRef = collection(firestore, 'leads');
      const q = query(leadsRef, where("ownerId", "==", staffId));
      const leadsSnapshot = await getDocs(q);

      if (!leadsSnapshot.empty) {
        const batch = writeBatch(firestore);
        leadsSnapshot.forEach(leadDoc => {
          batch.update(leadDoc.ref, {
            ownerId: masterAdmin.id,
            ownerName: masterAdmin.name
          });
        });
        await batch.commit();
      }

      await deleteDoc(staffDocRef);
      // NOTE: Deleting the Firebase Auth user is a separate, more complex operation
      // that requires admin privileges and is often handled server-side.
      // For this client-side example, we are only deleting the Firestore record.
      
      toast({
        title: "Profile Deleted",
        description: `The profile for ${formData.name} has been removed and their leads have been reassigned.`,
      });

      if (isEditingSelf && auth) {
        await signOut(auth);
        router.push('/login');
      } else {
        router.push('/staff');
      }
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete the profile.",
        variant: "destructive"
      });
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
            <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-base bg-slate-200 text-slate-600 font-semibold">
                        {getAvatarFallback(formData.name || '')}
                    </AvatarFallback>
                </Avatar>
                <div>
                     <h3 className="text-xl font-bold">Edit Staff Profile</h3>
                     <p className="text-sm text-muted-foreground">Editing profile for {formData.name}</p>
                </div>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Manage the main details of the staff member.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dui">DUI</Label>
                        <Input id="dui" value={formData.dui || ''} onChange={handleChange} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} onValueChange={handleRoleChange} disabled={isEditingMasterAdmin}>
                            <SelectTrigger>
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
                        <div className="space-y-2">
                            <Label htmlFor="supervisorId">Supervisor / Admin</Label>
                            <Select value={formData.supervisorId} onValueChange={handleSupervisorChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a supervisor or admin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {managers.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {formData.role === 'Supervisor' && (
                         <div className="space-y-2">
                            <Label htmlFor="supervisorId">Reports To (Admin)</Label>
                            <Select value={formData.supervisorId} onValueChange={handleSupervisorChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an admin" />
                                </SelectTrigger>
                                <SelectContent>
                                    {admins.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
             <CardFooter className="flex justify-end">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </CardFooter>
        </Card>
        
        {/* We can add the password reset card here in the future if needed */}

        {!isEditingMasterAdmin && (
             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground mb-4">
                      Deleting a staff member will reassign all their leads to the Master Admin and remove their profile. This action is permanent and cannot be undone.
                    </p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Profile for {formData.name}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                Yes, confirm deletion
                            </DropdownMenuItem>
                            <DropdownMenuItem>Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardContent>
            </Card>
        )}

    </main>
  );
}

    
