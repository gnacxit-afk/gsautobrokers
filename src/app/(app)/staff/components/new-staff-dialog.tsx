
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Staff, Role } from '@/lib/types';
import { Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuthContext } from '@/lib/auth';

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

const staffSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(roles, { required_error: 'Please select a role.' }),
  dui: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

export function NewStaffDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { auth } = useAuthContext();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });

  const onSubmit = async (data: StaffFormValues) => {
    if (!firestore || !auth) {
      toast({ title: "Error", description: "Services not available.", variant: "destructive" });
      return;
    }
    
    try {
      // 1. Create the Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const authUser = userCredential.user;

      // 2. Create the staff profile in Firestore using the Auth UID as the document ID
      const newStaffMember: Omit<Staff, 'id'> = {
        authUid: authUser.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        dui: data.dui,
        createdAt: serverTimestamp(),
        hireDate: serverTimestamp(),
        avatarUrl: '', // Default avatar
      };
      
      const staffDocRef = doc(firestore, 'staff', authUser.uid);
      await setDoc(staffDocRef, newStaffMember);

      toast({
        title: 'Employee Registered',
        description: `${data.name} has been added to the staff.`,
      });
      reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast({
        title: 'Registration Failed',
        description: error.code === 'auth/email-already-in-use' 
            ? 'This email is already registered.' 
            : error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new staff member. An account will be created for them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          
           <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} {...register('password')} />
                <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(p => !p)}
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="dui">DUI (Optional)</Label>
                <Input id="dui" {...register('dui')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
