
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Dealership } from '@/lib/types';
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

const dealershipSchema = z.object({
  name: z.string().min(2, 'Name is required.'),
  pocName: z.string().optional(),
  pocEmail: z.string().email('Invalid email address.').optional().or(z.literal('')),
  commission: z.coerce.number().min(0, 'Commission must be a positive number.').optional(),
  dealershipCode: z.string().optional(),
});

type DealershipFormValues = z.infer<typeof dealershipSchema>;

interface DealershipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Dealership, 'id' | 'createdAt'>) => void;
  initialData?: Dealership | null;
}

export function DealershipDialog({ isOpen, onClose, onSave, initialData }: DealershipDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealershipFormValues>({
    resolver: zodResolver(dealershipSchema),
  });
  
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({
          name: '',
          pocName: '',
          pocEmail: '',
          commission: 0,
          dealershipCode: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = (data: DealershipFormValues) => {
    onSave(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Dealership' : 'Add New Dealership'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this dealership partner.' : 'Enter the details for the new dealership.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dealership Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="pocName">Point of Contact Name</Label>
                <Input id="pocName" {...register('pocName')} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="pocEmail">Contact Email</Label>
                <Input id="pocEmail" type="email" {...register('pocEmail')} />
                {errors.pocEmail && <p className="text-xs text-destructive">{errors.pocEmail.message}</p>}
             </div>
          </div>
          
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="commission">Commission ($)</Label>
                <Input id="commission" type="number" {...register('commission')} />
                {errors.commission && <p className="text-xs text-destructive">{errors.commission.message}</p>}
             </div>
             <div className="space-y-2">
                <Label htmlFor="dealershipCode">Internal Code</Label>
                <Input id="dealershipCode" {...register('dealershipCode')} />
             </div>
          </div>

          <DialogFooter>
             <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Dealership')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
