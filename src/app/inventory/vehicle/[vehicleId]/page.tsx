'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Car, Gauge, GitCommitHorizontal, Palette, Wrench, Fuel, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-center justify-between border-b py-3">
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-semibold">{value}</span>
    </div>
);

function VehicleDetailsPage() {
  const params = useParams();
  const vehicleId = params.vehicleId as string;
  const firestore = useFirestore();

  const vehicleRef = useMemo(() => firestore ? doc(firestore, 'inventory', vehicleId) : null, [firestore, vehicleId]);
  const { data: vehicle, loading } = useDoc<Vehicle>(vehicleRef);

  if (loading) {
    return (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-4">
                    <Skeleton className="aspect-video w-full rounded-xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-20 w-28 rounded-lg" />
                        <Skeleton className="h-20 w-28 rounded-lg" />
                        <Skeleton className="h-20 w-28 rounded-lg" />
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!vehicle) {
    return <div className="text-center py-20">Vehicle not found.</div>;
  }

  const validPhotos = vehicle.photos?.filter(url => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }) || [];

  if (validPhotos.length === 0) {
      validPhotos.push('https://placehold.co/600x400/f0f2f4/9ca3af?text=Image+Not+Available');
  }


  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="lg:col-span-3">
                 <Carousel className="w-full">
                    <CarouselContent>
                        {validPhotos.map((photo, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-video relative rounded-xl overflow-hidden bg-slate-100">
                                    <Image src={photo} alt={`${vehicle.make} ${vehicle.model} image ${index + 1}`} fill className="object-cover" />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                </Carousel>
            </div>

            {/* Vehicle Details */}
            <div className="lg:col-span-2">
                <h1 className="text-3xl font-extrabold tracking-tight mb-1">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                <p className="text-muted-foreground text-lg mb-4">{vehicle.trim}</p>
                <div className="mb-6">
                    <span className="text-4xl font-bold text-primary">${vehicle.cashPrice.toLocaleString()}</span>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <DetailRow icon={Gauge} label="Mileage" value={`${vehicle.mileage.toLocaleString()} mi`} />
                        <DetailRow icon={Car} label="Condition" value={<Badge variant="outline">{vehicle.condition}</Badge>} />
                        <DetailRow icon={GitCommitHorizontal} label="Transmission" value={vehicle.transmission} />
                        <DetailRow icon={Wrench} label="Drivetrain" value={vehicle.driveTrain} />
                        <DetailRow icon={Palette} label="Exterior Color" value={vehicle.exteriorColor} />
                        <DetailRow icon={Palette} label="Interior Color" value={vehicle.interiorColor} />
                        <DetailRow icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                        <DetailRow icon={Hash} label="Stock #" value={vehicle.stockNumber} />
                    </CardContent>
                </Card>
                
                <div className="mt-6">
                    <Button size="lg" className="w-full">Contact Us About This Vehicle</Button>
                </div>
            </div>
        </div>
    </div>
  );
}

export default VehicleDetailsPage;
