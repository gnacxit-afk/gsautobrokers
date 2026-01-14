
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Application } from '@/lib/types';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  whatsappNumber: z.string().min(8, { message: 'Please enter a valid WhatsApp number.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  city: z.string().min(2, { message: 'Please enter your city.' }),
  acceptsCommission: z.boolean().refine(val => val === true, {
    message: 'You must accept the commission-based model to apply.',
  }),
  availableHours: z.string({ required_error: 'Please select your availability.' }),
  comfortableWithSales: z.enum(['yes', 'no'], {
    required_error: 'You must select an option.',
  }),
  salesExperienceDescription: z.string().optional(),
  motivation: z.string().min(10, { message: 'Motivation must be at least 10 characters.' }),
});

export function ApplicationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      whatsappNumber: '',
      email: '',
      city: '',
      acceptsCommission: false,
      salesExperienceDescription: '',
    },
  });
  const { toast } = useToast();
  const firestore = useFirestore();

  const watchComfortableWithSales = form.watch('comfortableWithSales');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        title: 'Error',
        description: 'Database connection is not available.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const now = new Date();
      // Data to be saved in the public-facing collection
      const publicApplicationData = {
        ...values,
        source: 'Organic',
        appliedDate: serverTimestamp(),
      };

      // Use the new public collection for submissions
      await addDoc(collection(firestore, 'publicApplications'), publicApplicationData);

      toast({
        title: 'Application Submitted!',
        description: 'Thank you for applying. We will be in touch shortly.',
      });
      form.reset();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission Failed',
        description: 'An error occurred while submitting your application. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Candidate Application</CardTitle>
        <CardDescription>Fill out the form below to apply for the broker position.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City and Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Miami, USA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="availableHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Availability</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="full-time">Full-Time (40+ hours/week)</SelectItem>
                      <SelectItem value="part-time">Part-Time (20-30 hours/week)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comfortableWithSales"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Are you comfortable in a 100% commission-based sales role?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Yes</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchComfortableWithSales === 'yes' && (
              <FormField
                control={form.control}
                name="salesExperienceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Briefly describe your sales experience (if any)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., sold cars for 2 years, worked in retail, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want to be a car broker with GS AUTOBROKERS?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your motivation..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsCommission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                     I understand and accept that this is a 100% commission-based role.
                    </FormLabel>
                     <FormDescription>
                        Your earnings are directly tied to your performance.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
