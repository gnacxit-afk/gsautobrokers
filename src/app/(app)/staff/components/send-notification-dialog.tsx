
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
import { addDoc, collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import type { Staff, Notification } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const notificationSchema = z.object({
  content: z.string().min(1, 'Notification content cannot be empty.'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export function SendNotificationDialog({ children, allStaff }: { children: React.ReactNode, allStaff: Staff[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState('all'); // 'all' or a specific user ID
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
      
      const recipients = target === 'all'
        ? allStaff
        : allStaff.filter(s => s.id === target);

      if (recipients.length === 0) {
        toast({ title: "No Recipients", description: "Could not find anyone to send the notification to.", variant: "destructive" });
        return;
      }

      recipients.forEach(staffMember => {
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
        description: `Your message has been sent to ${target === 'all' ? 'all staff members' : recipients[0].name}.`,
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
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>
            Send a message to all staff or a specific member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="targetUser">Recipient</Label>
            <Select value={target} onValueChange={setTarget}>
                <SelectTrigger id="targetUser">
                    <SelectValue placeholder="Select a recipient" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {allStaff.map(staffMember => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>{staffMember.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">Message</Label>
            <Textarea id="content" {...register('content')} placeholder="Type your notification here..." />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>

          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
