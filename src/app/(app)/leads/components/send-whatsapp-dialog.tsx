'use client';

import { useState, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { sendWhatsappMessage } from '@/ai/flows/send-whatsapp-flow';
import type { Lead } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface SendWhatsappDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export function SendWhatsappDialog({ lead, isOpen, onClose, initialMessage }: SendWhatsappDialogProps) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
  });

  useEffect(() => {
    if (isOpen && lead) {
      const defaultMessage = `Hola ${lead.name}, te saluda de GS Auto Brokers.`;
      reset({ message: initialMessage || defaultMessage });
    }
  }, [lead, isOpen, reset, initialMessage]);

  const onSubmit = async (data: MessageFormValues) => {
    if (!lead) return;

    try {
      const result = await sendWhatsappMessage({
        to: lead.phone,
        text: data.message,
      });

      if (result.success) {
        toast({
          title: 'Message Sent!',
          description: `Your WhatsApp message has been sent to ${lead.name}.`,
        });
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Send Failed',
        description: error.message || 'Could not send the WhatsApp message.',
        variant: 'destructive',
      });
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send WhatsApp to {lead.name}</DialogTitle>
          <DialogDescription>
            Compose your message below. The message will be sent to {lead.phone}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="py-4">
            <Label htmlFor="message" className="sr-only">
              Message
            </Label>
            <Textarea
              id="message"
              rows={5}
              {...register('message')}
              placeholder="Type your message here..."
            />
            {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
