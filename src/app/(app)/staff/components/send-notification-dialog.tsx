
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import type { Staff, Notification } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';

const notificationSchema = z.object({
  content: z.string().min(1, 'Notification content cannot be empty.'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export function SendNotificationDialog({ children, allStaff }: { children: React.ReactNode, allStaff: Staff[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
  });

  const onSubmit = async (data: NotificationFormValues) => {
    if (!firestore || !user || !allStaff || allStaff.length === 0) {
      toast({ title: "Error", description: "Could not send notification.", variant: "destructive" });
      return;
    }
    
    try {
      const batch = writeBatch(firestore);
      const notificationsCollection = collection(firestore, 'notifications');
      
      allStaff.forEach(staffMember => {
          const newNotification: Omit<Notification, 'id'> = {
              userId: staffMember.id,
              content: data.content,
              author: user.name,
              createdAt: serverTimestamp() as any,
              read: false,
          };
          batch.set(doc(notificationsCollection), newNotification);
      });
      
      await batch.commit();

      toast({
        title: 'Notification Sent',
        description: `Your message has been sent to all staff members.`,
      });
      reset();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: 'Send Failed',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Global Notification</DialogTitle>
          <DialogDescription>
            This message will be sent to every staff member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="content">Message</Label>
            <Textarea id="content" {...register('content')} placeholder="Type your notification here..." />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>

          <DialogFooter>
             <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send to All Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
