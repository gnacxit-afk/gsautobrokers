'use client';

import { useMemo, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Lead, Staff } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  taskTitle: z.string().min(3, 'Task title is required.'),
  leadName: z.string().min(2, 'Lead name is required.'),
  leadPhone: z.string().min(8, 'A valid phone number is required.'),
  leadChannel: z.enum(['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other']),
  ownerId: z.string().min(1, 'Please select an owner.'),
});

type FormValues = z.infer<typeof formSchema>;

interface NewTaskForNewLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  allStaff: Staff[];
}

export function NewTaskForNewLeadDialog({ isOpen, onOpenChange, allStaff }: NewTaskForNewLeadDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskTitle: '',
      leadName: '',
      leadPhone: '',
      leadChannel: 'Facebook',
      ownerId: user?.id || '',
    },
  });

  useEffect(() => {
    if (user?.id) {
      reset({ ownerId: user.id, leadChannel: 'Facebook', taskTitle: '', leadName: '', leadPhone: '' });
    }
  }, [user, reset]);
  
  const assignableStaff = useMemo(() => {
    if (!user || !allStaff) return [];
    if (user.role === 'Admin' || user.role === 'Supervisor') {
        return allStaff.filter(s => ['Admin', 'Supervisor', 'Broker'].includes(s.role));
    }
    return allStaff.filter(s => s.id === user.id);
  }, [user, allStaff]);


  const onSubmit = async (data: FormValues) => {
    if (!firestore || !user || !assignableStaff) return;
    
    const owner = assignableStaff.find(s => s.id === data.ownerId);
    if (!owner) {
      toast({ title: 'Error', description: 'Selected owner not found.', variant: 'destructive' });
      return;
    }

    try {
      // 1. Create the lead
      const leadsCollection = collection(firestore, 'leads');
      const leadData = {
        name: data.leadName,
        phone: data.leadPhone,
        channel: data.leadChannel,
        ownerId: data.ownerId,
        ownerName: owner.name,
        stage: 'Nuevo' as const,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        language: 'Spanish' as const,
      };
      const newLeadRef = await addDoc(leadsCollection, leadData);
      
      // 2. Create the system note for lead creation
      const leadNotesCollection = collection(firestore, 'leads', newLeadRef.id, 'noteHistory');
      await addDoc(leadNotesCollection, {
        content: 'Lead created.',
        author: 'System',
        date: serverTimestamp(),
        type: 'System',
      });
      
      // 3. Create the task linked to the new lead
      const todosCollection = collection(firestore, 'todos');
      await addDoc(todosCollection, {
        title: data.taskTitle,
        completed: false,
        createdAt: serverTimestamp(),
        userId: user.id,
        leadId: newLeadRef.id,
        leadName: data.leadName,
      });

      toast({
        title: 'Success!',
        description: `Lead "${data.leadName}" and their first task have been created.`,
      });
      onOpenChange(false);
      reset();

    } catch (error) {
      console.error("Error creating new lead and task:", error);
      toast({
        title: 'Creation Failed',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task for New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead and their first task in one step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Task Title</Label>
            <Input id="taskTitle" {...register('taskTitle')} placeholder="e.g., Call to qualify needs" />
            {errors.taskTitle && <p className="text-xs text-red-500">{errors.taskTitle.message}</p>}
          </div>

          <hr/>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadName">Lead's Full Name</Label>
              <Input id="leadName" {...register('leadName')} />
              {errors.leadName && <p className="text-xs text-red-500">{errors.leadName.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="leadPhone">Lead's Phone</Label>
              <Input id="leadPhone" {...register('leadPhone')} />
              {errors.leadPhone && <p className="text-xs text-red-500">{errors.leadPhone.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="leadChannel">Channel</Label>
                <Controller
                    control={control}
                    name="leadChannel"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="leadChannel">
                            <SelectValue placeholder="Select channel" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Facebook">Facebook</SelectItem>
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Call">Call</SelectItem>
                            <SelectItem value="Visit">Visit</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                />
            </div>
             <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Controller
                control={control}
                name="ownerId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={assignableStaff.length <= 1}>
                    <SelectTrigger id="ownerId">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableStaff.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Lead & Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
