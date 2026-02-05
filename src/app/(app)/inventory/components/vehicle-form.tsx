
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Vehicle, Dealership } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2, UploadCloud, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const vehicleSchema = z.object({
  year: z.coerce.number().min(1980, "Must be after 1980").max(new Date().getFullYear() + 1),
  make: z.string().min(1, 'Make is required.'),
  model: z.string().min(1, 'Model is required.'),
  trim: z.string().optional(),
  stockNumber: z.string(),
  cashPrice: z.coerce.number().min(0),
  downPayment: z.coerce.number().min(0),
  condition: z.enum(['New', 'Used', 'Rebuilt']),
  mileage: z.coerce.number().min(0),
  transmission: z.enum(['Automatic', 'Manual', 'CVT']),
  driveTrain: z.enum(['FWD', 'RWD', 'AWD', '4x4']),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  fuelType: z.enum(['Gasoline', 'Diesel', 'Electric', 'Hybrid']),
  status: z.enum(['Active', 'Pending', 'Sold']),
  dealershipId: z.string().min(1, 'A dealership is required.'),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const isEditing = !!vehicle;
  const [newVehicleId] = useState(() => uuidv4().split('-')[0].toUpperCase());

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(
    firestore ? collection(firestore, 'dealerships') : null
  );

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  useEffect(() => {
    if (isEditing && vehicle) {
        reset(vehicle);
        if (vehicle.photos) {
          setImagePreviews(vehicle.photos);
        }
    } else if (!isEditing) {
        reset({
            dealershipId: '',
            downPayment: 1500,
            condition: 'Used',
            transmission: 'Automatic',
            driveTrain: 'AWD',
            fuelType: 'Gasoline',
            status: 'Active',
            stockNumber: 'Select a dealership to generate',
            year: new Date().getFullYear(),
            cashPrice: 0,
            mileage: 0,
        });
    }
  }, [isEditing, vehicle, reset]);

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

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    if (imagePreviews.length + files.length > 15) {
      toast({ title: 'Error', description: 'You can upload a maximum of 15 images.', variant: 'destructive' });
      return;
    }
    const newFilePreviews: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newFilePreviews.push(reader.result as string);
        if (newFilePreviews.length === files.length) {
          setImagePreviews(prev => [...prev, ...newFilePreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };
  
  const removeImage = (indexToRemove: number) => {
      setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };


  const onSubmit = async (data: VehicleFormValues) => {
    if (!firestore || !dealerships) return;
    
    if (!data.dealershipId) {
        toast({ title: 'Error', description: 'Please select a dealership.', variant: 'destructive'});
        return;
    }

    const selectedDealership = dealerships.find(d => d.id === data.dealershipId);
    if (!selectedDealership) {
        toast({ title: 'Error', description: 'Selected dealership not found.', variant: 'destructive'});
        return;
    }

    const processedData = {
        ...data,
        photos: imagePreviews,
        dealershipCode: selectedDealership.dealershipCode,
        commission: selectedDealership.commission,
    };

    try {
        if (isEditing && vehicle.id) {
            const vehicleRef = doc(firestore, 'inventory', vehicle.id);
            await updateDoc(vehicleRef, processedData as any);
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

  const handleDelete = async () => {
    if (!firestore || !isEditing || !vehicle?.id) return;
    try {
        await deleteDoc(doc(firestore, 'inventory', vehicle.id));
        toast({ title: 'Vehicle Deleted', description: 'The vehicle has been successfully removed from inventory.' });
        router.push('/inventory/management');
    } catch (error: any) {
        toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
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
                {isEditing && (user?.role === 'Admin' || user?.role === 'Supervisor') && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Are you sure?</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                                Yes, confirm deletion
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Cancel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
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
                 <div className="space-y-2 max-w-xs"><Label>Dealership</Label><Controller name="dealershipId" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value} disabled={isEditing}><SelectTrigger><SelectValue placeholder="Select a Dealership"/></SelectTrigger><SelectContent>{dealerships?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>)}/>{errors.dealershipId && <p className="text-xs text-destructive">{errors.dealershipId.message}</p>}</div>
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
                 <div className="space-y-2"><Label>Drive Train</Label><Controller name="driveTrain" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="FWD">FWD</SelectItem><SelectItem value="RWD">RWD</SelectItem><SelectItem value="AWD">AWD</SelectItem><SelectItem value="4x4">4x4</SelectItem></SelectContent></Select>)}/></div>
                 <div className="space-y-2"><Label>Exterior Color</Label><Input {...register('exteriorColor')} /></div>
                 <div className="space-y-2"><Label>Interior Color</Label><Input {...register('interiorColor')} /></div>
                 <div className="space-y-2"><Label>Fuel Type</Label><Controller name="fuelType" control={control} render={({field}) => (<Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Gasoline">Gasoline</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="Electric">Electric</SelectItem><SelectItem value="Hybrid">Hybrid</SelectItem></SelectContent></Select>)}/></div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>
                    Drag and drop up to 15 images, or click to select files. The first image will be the main one.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div 
                    className={cn(
                        "mt-2 flex justify-center items-center flex-col w-full h-48 border-2 border-dashed rounded-lg cursor-pointer",
                        isDragging ? "border-primary bg-primary/10" : "border-slate-300 bg-slate-50"
                    )}
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                 >
                     <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
                     <p className="text-sm text-slate-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                     </p>
                     <p className="text-xs text-slate-400">Up to 15 images</p>
                     <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files)}
                    />
                 </div>

                 {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group aspect-square">
                                <Image src={preview} alt={`Preview ${index}`} fill className="object-cover rounded-md" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                 )}
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
