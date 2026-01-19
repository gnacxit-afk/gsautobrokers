'use client';

import { useState, useEffect } from 'react';
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
import type { Lead, Staff, Dealership } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const leadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().min(8, 'Please enter a valid phone number.'),
  email: z.string().email('Please enter a valid email.').optional().or(z.literal('')),
  channel: z.enum(['Facebook', 'WhatsApp', 'Call', 'Visit', 'Other']),
  ownerId: z.string().min(1, 'Please select an owner.'),
  dealershipId: z.string().min(1, 'Please select a dealership.'),
  initialNotes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddLead: (leadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName' | 'dealershipName'> & { initialNotes?: string }, callback?: (lead: Lead) => void) => void;
  staff: Staff[];
  dealerships: Dealership[];
  defaultOwnerId: string;
}

export function AddLeadDialog({ isOpen, onOpenChange, onAddLead, staff, dealerships, defaultOwnerId }: AddLeadDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      channel: 'Facebook',
      ownerId: defaultOwnerId,
      dealershipId: '',
      initialNotes: '',
    },
  });
  
  useEffect(() => {
    if (defaultOwnerId) {
      reset({ ownerId: defaultOwnerId, channel: 'Facebook', dealershipId: dealerships[0]?.id || '' });
    }
  }, [defaultOwnerId, reset, dealerships]);

  const onSubmit = async (data: LeadFormValues) => {
    const leadData = {
      ...data,
      stage: 'Nuevo' as const,
      language: 'Spanish' as const,
    };
    onAddLead(leadData, (createdLead) => {
        // This callback will be executed after the lead is successfully created.
        onOpenChange(false);
        reset();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the details for the new lead. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="channel">Channel</Label>
                <Controller
                    control={control}
                    name="channel"
                    render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="channel">
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
                {errors.channel && <p className="text-xs text-red-500">{errors.channel.message}</p>}
            </div>
             <div className="grid gap-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Controller
                control={control}
                name="ownerId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="ownerId">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.ownerId && <p className="text-xs text-red-500">{errors.ownerId.message}</p>}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="dealershipId">Dealership</Label>
            <Controller
              control={control}
              name="dealershipId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="dealershipId">
                    <SelectValue placeholder="Select a dealership" />
                  </SelectTrigger>
                  <SelectContent>
                    {dealerships.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.dealershipId && <p className="text-xs text-red-500">{errors.dealershipId.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="initialNotes">Initial Notes (Optional)</Label>
            <Textarea id="initialNotes" {...register('initialNotes')} placeholder="Any initial comments or details..." />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    