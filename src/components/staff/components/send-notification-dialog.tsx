
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Staff } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const notificationSchema = z.object({
  content: z.string().min(1, 'Notification content cannot be empty.'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export function SendNotificationDialog({ children, allStaff }: { children: React.ReactNode, allStaff: Staff[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState('all'); // 'all' or a specific user ID
  const { toast } = useToast();
  const firestore = useFirestore();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
  });

  const onSubmit = async (data: NotificationFormValues) => {
    if (!firestore) {
      toast({ title: "Error", description: "Database not available.", variant: "destructive" });
      return;
    }
    
    try {
      const functions = getFunctions(firestore.app);
      const sendManualNotification = httpsCallable(functions, 'sendManualNotification');
      
      const result: any = await sendManualNotification({ target, content: data.content });

      if (result.data.success) {
        toast({
            title: 'Notification Sent!',
            description: result.data.message || 'Your message has been dispatched.',
        });
        reset();
        setIsOpen(false);
      } else {
        throw new Error(result.data.message || 'Failed to send notification.');
      }
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: 'Send Failed',
        description: error.message || 'An error occurred while communicating with the server.',
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
            Send a message to all staff or a specific member. This will send an in-app and a push notification.
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
             <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Sending...' : 'Send Notification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
