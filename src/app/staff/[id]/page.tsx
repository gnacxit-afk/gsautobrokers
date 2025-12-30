"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStaff, updateStaffMember } from "@/lib/mock-data";
import type { Staff, Role } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { AccessDenied } from "@/components/access-denied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserCircle2, Eye, EyeOff } from "lucide-react";

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

export default function StaffProfilePage() {
  const { user, reloadUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const staffId = params.id as string;

  // Use a state for staff list to ensure re-renders on update
  const [allStaff, setAllStaff] = useState(() => getStaff());
  const [showPassword, setShowPassword] = useState(false);
  
  // Effect to refetch staff if needed, e.g., after an update
  useEffect(() => {
    // This is a simple way to refresh. In a real app, this might be triggered by an event.
    setAllStaff(getStaff());
  }, []);


  const staffMember = useMemo(() => allStaff.find(s => s.id === staffId), [allStaff, staffId]);

  const [formData, setFormData] = useState<Partial<Staff>>(staffMember || {});

  useEffect(() => {
    setFormData(staffMember || {});
  }, [staffMember]);


  const supervisors = useMemo(() => allStaff.filter(s => s.role === 'Supervisor'), [allStaff]);
  const admins = useMemo(() => allStaff.filter(s => s.role === 'Admin'), [allStaff]);

  if (user?.role !== 'Admin') {
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
    setFormData(prev => ({ ...prev, role }));
  };

   const handleSupervisorChange = (supervisorId: string) => {
    setFormData(prev => ({ ...prev, supervisorId }));
  };

  const handleSaveChanges = () => {
    const updated = updateStaffMember(staffId, formData);
    if (updated) {
        toast({
            title: "Profile Updated",
            description: `Details for ${formData.name} have been updated.`,
        });
        setAllStaff(getStaff());

        // If the edited user is the current user, reload auth context
        if (user && user.id === staffId) {
            reloadUser();
        }

        router.refresh();
    } else {
        toast({
            title: "Update Failed",
            description: "Could not save changes.",
            variant: "destructive",
        });
    }
  };

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
                        <CardDescription>ID: {formData.id}</CardDescription>
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
                        <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dui">DUI</Label>
                        <Input id="dui" value={formData.dui || ''} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <div className="relative">
                            <Input id="current-password" type={showPassword ? 'text' : 'password'} value={formData.password || ''} disabled className="bg-gray-100 pr-10" />
                            <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                                >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Reset Password</Label>
                        <Input id="password" type="password" placeholder="Enter new password" onChange={handleChange} />
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
        </Card>

    </main>
  );
}
