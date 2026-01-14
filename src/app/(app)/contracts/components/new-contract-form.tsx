'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createContractEvent } from './utils';

const contractSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  version: z.string().min(1, 'Version is required (e.g., 1.0).'),
  content: z.string().min(50, 'Contract content must be at least 50 characters.'),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export function NewContractForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
  });

  const onSubmit = async (data: ContractFormValues) => {
    if (!firestore || !user) {
      toast({ title: 'Error', description: 'Cannot create contract.', variant: 'destructive' });
      return;
    }

    try {
      const batch = writeBatch(firestore);
      const contractsCollection = collection(firestore, 'contracts');
      
      const newContractData = {
        ...data,
        isActive: false, // New contracts are never active by default
        createdAt: serverTimestamp(),
      };
      
      // We need a document reference to pass to the event creator
      const newContractRef = doc(contractsCollection);
      batch.set(newContractRef, newContractData);

      // Create an audit event for the creation
      await createContractEvent(batch, firestore, user, { ...newContractData, id: newContractRef.id, createdAt: new Date() }, 'Created');
      
      await batch.commit();

      toast({
        title: 'Contract Created',
        description: `Version ${data.version} of "${data.title}" has been saved.`,
      });
      reset();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Could not save the new contract.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Contract</CardTitle>
        <CardDescription>
          Author a new contract version. It will be inactive by default. Use Markdown for formatting.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Contract Title</Label>
              <Input id="title" {...register('title')} placeholder="e.g., Broker Services Agreement" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input id="version" {...register('version')} placeholder="e.g., 1.0, 2.1" />
              {errors.version && <p className="text-xs text-red-500">{errors.version.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Contract Content (Markdown)</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Use Markdown for formatting, e.g., # Heading, - List item"
              rows={15}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save New Contract'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
