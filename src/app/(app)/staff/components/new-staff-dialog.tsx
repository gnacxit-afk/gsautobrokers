
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useFirestore, useCollection } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  limit,
  getDocs,
  arrayUnion,
  updateDoc,
} from 'firebase/firestore';
import type { Staff, Role, Candidate, Course } from '@/lib/types';
import { Eye, EyeOff } from 'lucide-react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { COMMISSION_PER_VEHICLE } from '@/lib/mock-data';

const roles: Role[] = ["Admin", "Supervisor", "Broker"];

const staffSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(roles, { required_error: 'Please select a role.' }),
  dui: z.string().optional(),
  supervisorId: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface NewStaffDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  candidate?: Candidate | null;
  onStaffCreated?: (candidateId: string) => void;
  children?: React.ReactNode;
}

export function NewStaffDialog({ isOpen, onOpenChange, candidate, onStaffCreated, children }: NewStaffDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(
    firestore ? collection(firestore, 'staff') : null
  );

  const supervisors = useMemo(() => allStaff?.filter(s => s.role === 'Supervisor') || [], [allStaff]);
  const admins = useMemo(() => allStaff?.filter(s => s.role === 'Admin') || [], [allStaff]);
  const managers = useMemo(() => [...(supervisors || []), ...(admins || [])], [supervisors, admins]);
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
  });

  const watchedRole = watch('role');

  useEffect(() => {
    if (isOpen && candidate) {
      reset({
        name: candidate.fullName,
        email: candidate.email,
        password: '',
        role: 'Broker', // Default role for new candidates
        dui: '',
      });
    } else if (!isOpen) {
      reset({ name: '', email: '', password: '', role: undefined, dui: '' });
    }
  }, [isOpen, candidate, reset]);

  const onSubmit = async (data: StaffFormValues) => {
    if (!firestore) {
      toast({ title: "Error", description: "Database service not available.", variant: "destructive" });
      return;
    }

    const tempAppName = `user-creation-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
      const authUser = userCredential.user;

      const newStaffMember: Omit<Staff, 'id'> = {
        authUid: authUser.uid,
        name: data.name,
        email: data.email,
        role: data.role,
        dui: data.dui,
        supervisorId: data.supervisorId,
        commission: COMMISSION_PER_VEHICLE,
        canReceiveIncomingCalls: data.role === 'Admin',
        createdAt: serverTimestamp(),
        hireDate: serverTimestamp(),
        avatarUrl: '',
        enrolledCourses: [],
      };
      
      const staffDocRef = doc(firestore, 'staff', authUser.uid);
      await setDoc(staffDocRef, newStaffMember);

      if (candidate && onStaffCreated) {
        await onStaffCreated(candidate.id);
      }
      
      try {
        const coursesRef = collection(firestore, 'courses');
        const q = query(coursesRef, where('isDefaultOnboarding', '==', true), limit(1));
        const courseSnapshot = await getDocs(q);

        if (!courseSnapshot.empty) {
          const defaultCourse = { id: courseSnapshot.docs[0].id, ...courseSnapshot.docs[0].data() } as Course;
          
          const progressRef = doc(firestore, 'userProgress', `${authUser.uid}_${defaultCourse.id}`);
          await setDoc(progressRef, {
            userId: authUser.uid,
            courseId: defaultCourse.id,
            completed: false,
            lessonProgress: {},
            quizScores: {},
          });

          await updateDoc(staffDocRef, {
            enrolledCourses: arrayUnion(defaultCourse.id)
          });
          
          toast({
            title: 'Employee Registered & Enrolled!',
            description: `${data.name} has been added and automatically enrolled in the onboarding course.`,
          });

        } else {
           toast({
            title: 'Employee Registered',
            description: `${data.name} has been added to the staff. No default onboarding course was found.`,
          });
        }
      } catch (enrollError) {
        console.error("Error during auto-enrollment:", enrollError);
        toast({
          title: 'Employee Registered, Enrollment Failed',
          description: `Staff profile for ${data.name} was created, but automatic course enrollment failed. Please enroll them manually.`,
          variant: 'destructive'
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      toast({
        title: 'Registration Failed',
        description: error.code === 'auth/email-already-in-use' 
            ? 'This email is already registered.' 
            : error.message,
        variant: 'destructive',
      });
    } finally {
        await deleteApp(tempApp);
    }
  };
  
  if (children) {
    return (
       <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>{candidate ? `Convert Candidate: ${candidate.fullName}` : 'Register New Employee'}</DialogTitle>
            <DialogDescription>
                {candidate ? "Complete the profile to create a staff account for this candidate." : "Enter the details for the new staff member. An account will be created for them."}
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
                <Input id="email" type="email" {...register('email')} disabled={!!candidate} />
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

            {watchedRole === 'Broker' && (
                <div className="grid gap-2">
                    <Label htmlFor="supervisorId">Supervisor / Admin</Label>
                    <Controller
                        control={control}
                        name="supervisorId"
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="supervisorId">
                                <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {managers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.supervisorId && <p className="text-xs text-red-500">{errors.supervisorId.message}</p>}
                </div>
            )}

            {watchedRole === 'Supervisor' && (
                <div className="grid gap-2">
                    <Label htmlFor="supervisorId">Reports To (Admin)</Label>
                     <Controller
                        control={control}
                        name="supervisorId"
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="supervisorId">
                                <SelectValue placeholder="Select an admin" />
                            </SelectTrigger>
                            <SelectContent>
                                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.supervisorId && <p className="text-xs text-red-500">{errors.supervisorId.message}</p>}
                </div>
            )}

            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Employee'}
                </Button>
            </DialogFooter>
            </form>
          </DialogContent>
       </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>{candidate ? `Convert Candidate: ${candidate.fullName}` : 'Register New Employee'}</DialogTitle>
            <DialogDescription>
                {candidate ? "Complete the profile to create a staff account for this candidate." : "Enter the details for the new staff member. An account will be created for them."}
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
                <Input id="email" type="email" {...register('email')} disabled={!!candidate} />
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

            {watchedRole === 'Broker' && (
                <div className="grid gap-2">
                    <Label htmlFor="supervisorId">Supervisor / Admin</Label>
                    <Controller
                        control={control}
                        name="supervisorId"
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="supervisorId">
                                <SelectValue placeholder="Select a manager" />
                            </SelectTrigger>
                            <SelectContent>
                                {managers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.supervisorId && <p className="text-xs text-red-500">{errors.supervisorId.message}</p>}
                </div>
            )}

            {watchedRole === 'Supervisor' && (
                <div className="grid gap-2">
                    <Label htmlFor="supervisorId">Reports To (Admin)</Label>
                     <Controller
                        control={control}
                        name="supervisorId"
                        render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger id="supervisorId">
                                <SelectValue placeholder="Select an admin" />
                            </SelectTrigger>
                            <SelectContent>
                                {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.supervisorId && <p className="text-xs text-red-500">{errors.supervisorId.message}</p>}
                </div>
            )}
            
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
