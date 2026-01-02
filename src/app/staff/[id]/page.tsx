"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Staff, Role } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { AccessDenied } from "@/components/access-denied";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserCircle2, Eye, EyeOff, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

export default function StaffProfilePage() {
  const { user, reloadUser, logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const staffId = params.id as string;
  const firestore = useFirestore();

  const [showPassword, setShowPassword] = useState(false);
  
  const staffDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'staff', staffId) : null, [firestore, staffId]);
  const allStaffCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'staff') : null, [firestore]);

  const { data: staffMember, loading: staffMemberLoading } = useDoc(staffDocRef);
  const { data: allStaff, loading: allStaffLoading } = useCollection(allStaffCollectionRef);

  const [formData, setFormData] = useState<Partial<Staff>>(staffMember as Staff || {});

  useEffect(() => {
    if (staffMember) {
      setFormData(staffMember as Staff);
    }
  }, [staffMember]);


  const supervisors = useMemo(() => (allStaff as Staff[] || []).filter(s => s.role === 'Supervisor'), [allStaff]);
  const admins = useMemo(() => (allStaff as Staff[] || []).filter(s => s.role === 'Admin'), [allStaff]);

  if (user?.role !== 'Admin') {
    return <AccessDenied />;
  }

  if (staffMemberLoading || allStaffLoading) {
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
    setFormData(prev => ({ ...prev, role }));
  };

   const handleSupervisorChange = (supervisorId: string) => {
    setFormData(prev => ({ ...prev, supervisorId }));
  };

  const handleSaveChanges = async () => {
    if (!firestore || !staffDocRef) return;
    try {
        // NOTE: Password update would require a separate, secure flow with Firebase Auth, not just Firestore.
        // We will not update the password here.
        const { password, id, ...updateData } = formData;
        
        await updateDoc(staffDocRef, updateData);
        
        toast({
            title: "Profile Updated",
            description: `Details for ${formData.name} have been updated.`,
        });

        if (user && user.id === staffId) {
            reloadUser();
        }

    } catch (error) {
        toast({
            title: "Update Failed",
            description: "Could not save changes.",
            variant: "destructive",
        });
    }
  };

  const handleDelete = async () => {
    if (!firestore || !staffDocRef) return;
    try {
      // NOTE: This only deletes the Firestore record, not the Firebase Auth user.
      // A full user deletion would require a Firebase Function to delete the auth user.
      await deleteDoc(staffDocRef);
      toast({
        title: "Profile Deleted",
        description: `The profile for ${formData.name} has been permanently removed.`,
      });
      if (user?.id === staffId) {
        logout();
      } else {
        router.push('/staff');
      }
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Could not delete the profile.",
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
            <h3 className="text-xl font-bold">Edit Staff Profile</h3>
        </div>

        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                     <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserCircle2 className="h-10 w-10 text-slate-400" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">{formData.name}</CardTitle>
                        <CardDescription>DUI (ID): {formData.dui}</CardDescription>
                    </div>
                </div>
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
                        <Select value={formData.role} onValueChange={handleRoleChange}>
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
                            <Label htmlFor="supervisorId">Supervisor</Label>
                            <Select value={formData.supervisorId} onValueChange={handleSupervisorChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a supervisor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {supervisors.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                 <div className="flex justify-end">
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
            </CardContent>
            <CardFooter className="bg-red-50/50 border-t p-6 rounded-b-lg flex-col items-start gap-3">
                 <h4 className="font-bold text-red-700">Danger Zone</h4>
                <p className="text-sm text-red-600">
                    Deleting a staff member will remove their profile data, but the authentication record will remain.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Profile
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the profile for
                            <span className="font-bold"> {formData.name}</span>.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Yes, delete profile
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>

    </main>
  );
}
