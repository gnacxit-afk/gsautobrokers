
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Vehicle, Dealership } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const vehicleSchema = z.object({
  year: z.coerce.number().min(1980, "Must be after 1980").max(new Date().getFullYear() + 1),
  make: z.string().min(2, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  stockNumber: z.string().min(1, "Stock number is required"),
  cashPrice: z.coerce.number().min(0),
  downPayment: z.coerce.number().min(0),
  condition: z.enum(['New', 'Used', 'Rebuilt']),
  mileage: z.coerce.number().min(0),
  transmission: z.enum(['Automatic', 'Manual', 'CVT']),
  driveTrain: z.string().min(2, "Drive train is required"),
  exteriorColor: z.string().min(2, "Exterior color is required"),
  interiorColor: z.string().min(2, "Interior color is required"),
  fuelType: z.enum(['Gasoline', 'Diesel', 'Electric', 'Hybrid']),
  status: z.enum(['Active', 'Pending', 'Sold']),
  dealershipId: z.string().min(1, "Dealership is required."),
  photos: z.array(z.string().url().or(z.literal(''))).optional().default(['','','','','']),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isEditing = !!vehicle;
  const [newVehicleId] = useState(() => uuidv4().split('-')[0].toUpperCase());

  const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(
    firestore ? collection(firestore, 'dealerships') : null
  );

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: isEditing ? {
        ...vehicle,
        photos: Array.isArray(vehicle.photos) ? [...vehicle.photos, ...Array(5 - vehicle.photos.length).fill('')] : Array(5).fill(''),
    } : {
        condition: 'Used',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        status: 'Active',
        photos: Array(5).fill(''),
        stockNumber: 'Select a dealership to generate',
    }
  });

  const watchedDealershipId = watch('dealershipId');

  useEffect(() => {
    if (!isEditing) {
        if (watchedDealershipId && dealerships) {
            const selectedDealership = dealerships.find(d => d.id === watchedDealershipId);
            if (selectedDealership?.dealershipCode) {
                const stockNumber = `${selectedDealership.dealershipCode.toUpperCase()}-${newVehicleId}`;
                setValue('stockNumber', stockNumber);
            } else {
                 setValue('stockNumber', 'Dealership has no code...');
            }
        } else {
            setValue('stockNumber', 'Select a dealership to generate');
        }
    }
  }, [watchedDealershipId, dealerships, isEditing, newVehicleId, setValue]);

  const onSubmit = async (data: VehicleFormValues) => {
    if (!firestore || !dealerships) return;

    const selectedDealership = dealerships.find(d => d.id === data.dealershipId);
    if (!selectedDealership) {
        toast({ title: 'Error', description: 'Selected dealership not found.', variant: 'destructive'});
        return;
    }

    const processedData = {
        ...data,
        photos: data.photos?.filter(url => url && url.trim() !== '') || [],
        dealershipCode: selectedDealership.dealershipCode,
        commission: selectedDealership.commission,
    };

    try {
        if (isEditing && vehicle.id) {
            const vehicleRef = doc(firestore, 'inventory', vehicle.id);
            await updateDoc(vehicleRef, processedData);
            toast({ title: 'Vehicle Updated', description: 'The vehicle details have been saved.' });
        } else {
            await addDoc(collection(firestore, 'inventory'), {
                ...processedData,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Vehicle Added', description: 'The new vehicle is now in your inventory.' });
        }
        router.push('/inventory/management');
    } catch (error: any) {
        toast({ title: 'Save Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                 <Button type="button" variant="outline" size="icon" onClick={() => router.push('/inventory/management')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
                    <p className="text-muted-foreground">{isEditing ? 'Update the details for this vehicle.' : 'Fill in the form to add a new car to the inventory.'}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2"><Label>Year</Label><Input type="number" {...register('year')} />{errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}</div>
                <div className="space-y-2"><Label>Make</Label><Input {...register('make')} />{errors.make && <p className="text-xs text-destructive">{errors.make.message}</p>}</div>
                <div className="space-y-2"><Label>Model</Label><Input {...register('model')} />{errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}</div>
                <div className="space-y-2"><Label>Trim</Label><Input {...register('trim')} /></div>
            </CardContent>
        </Card>
        
         <Card>
            <CardHeader><CardTitle>Dealership</CardTitle></CardHeader>
            <CardContent>
                 <div className="space-y-2 max-w-xs"><Label>Dealership</Label><Controller name="dealershipId" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value} disabled={dealershipsLoading}><SelectTrigger><SelectValue placeholder="Select a Dealership"/></SelectTrigger><SelectContent>{dealerships?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>)}/>{errors.dealershipId && <p className="text-xs text-destructive">{errors.dealershipId.message}</p>}</div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Identification</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2"><Label>Stock #</Label><Input {...register('stockNumber')} disabled />{errors.stockNumber && <p className="text-xs text-destructive">{errors.stockNumber.message}</p>}</div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2"><Label>Cash Price ($)</Label><Input type="number" {...register('cashPrice')} />{errors.cashPrice && <p className="text-xs text-destructive">{errors.cashPrice.message}</p>}</div>
                 <div className="space-y-2"><Label>Downpayment ($)</Label><Input type="number" {...register('downPayment')} />{errors.downPayment && <p className="text-xs text-destructive">{errors.downPayment.message}</p>}</div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Features & Stats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2"><Label>Condition</Label><Controller name="condition" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="New">New</SelectItem><SelectItem value="Used">Used</SelectItem><SelectItem value="Rebuilt">Rebuilt</SelectItem></SelectContent></Select>)}/></div>
                 <div className="space-y-2"><Label>Mileage</Label><Input type="number" {...register('mileage')} />{errors.mileage && <p className="text-xs text-destructive">{errors.mileage.message}</p>}</div>
                 <div className="space-y-2"><Label>Transmission</Label><Controller name="transmission" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Automatic">Automatic</SelectItem><SelectItem value="Manual">Manual</SelectItem><SelectItem value="CVT">CVT</SelectItem></SelectContent></Select>)}/></div>
                 <div className="space-y-2"><Label>Drive Train</Label><Input {...register('driveTrain')} />{errors.driveTrain && <p className="text-xs text-destructive">{errors.driveTrain.message}</p>}</div>
                 <div className="space-y-2"><Label>Exterior Color</Label><Input {...register('exteriorColor')} />{errors.exteriorColor && <p className="text-xs text-destructive">{errors.exteriorColor.message}</p>}</div>
                 <div className="space-y-2"><Label>Interior Color</Label><Input {...register('interiorColor')} />{errors.interiorColor && <p className="text-xs text-destructive">{errors.interiorColor.message}</p>}</div>
                 <div className="space-y-2"><Label>Fuel Type</Label><Controller name="fuelType" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Gasoline">Gasoline</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="Electric">Electric</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem></SelectContent></Select>)}/></div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Photos</CardTitle><CardDescription>Enter the URLs for the vehicle photos. The first URL will be used as the main image.</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(5)].map((_, index) => (
                    <div className="space-y-2" key={index}>
                        <Label>Photo URL {index + 1}</Label>
                        <Input {...register(`photos.${index}`)} placeholder="https://..."/>
                    </div>
                ))}
            </CardContent>
        </Card>
         <Card>
            <CardHeader><CardTitle>Listing Status</CardTitle></CardHeader>
            <CardContent>
                 <div className="space-y-2 max-w-xs"><Label>Status</Label><Controller name="status" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Sold">Sold</SelectItem></SelectContent></Select>)}/></div>
            </CardContent>
        </Card>
    </form>
  );
}
