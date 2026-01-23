'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  let imageUrl = 'https://placehold.co/600x400/f0f2f4/9ca3af?text=GS+Auto';
  if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
    try {
      // This will throw an error for invalid URLs, which we catch.
      new URL(vehicle.photos[0]); 
      imageUrl = vehicle.photos[0];
    } catch (error) {
      // If photos[0] is not a valid URL, imageUrl remains the placeholder.
    }
  }

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
      <Link href={`/inventory/vehicle/${vehicle.id}`} className="flex flex-col h-full">
        <div className="relative h-60 w-full overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} 
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
        <CardContent className="p-4 space-y-4 flex flex-col flex-grow">
          <div className="flex-grow">
            <h3 className="text-lg font-bold truncate">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
            <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
          </div>
          <div className="flex justify-between items-center text-sm border-t pt-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Price</span>
              <span className="font-bold text-primary">${vehicle.cashPrice.toLocaleString()}</span>
            </div>
            <div className="flex flex-col text-right">
               <span className="text-xs text-muted-foreground">Mileage</span>
               <span className="font-semibold">{vehicle.mileage.toLocaleString()} mi</span>
            </div>
          </div>
          <Button asChild className="w-full mt-auto">
            <Link href={`/inventory/vehicle/${vehicle.id}`}>View Details</Link>
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}


export default function PublicInventoryPage() {
  const firestore = useFirestore();

  const inventoryQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "inventory"),
      where("status", "==", "Active"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: vehicles, loading } = useCollection<Vehicle>(inventoryQuery);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">Our Inventory</h1>
            <p className="mt-2 text-lg text-muted-foreground">Browse our selection of quality pre-owned vehicles.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
                [...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-60 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))
            ) : vehicles && vehicles.length > 0 ? (
                vehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))
            ) : (
                <div className="col-span-full text-center py-16">
                    <h3 className="text-xl font-semibold">No vehicles available at the moment.</h3>
                    <p className="text-muted-foreground">Please check back soon for new listings.</p>
                </div>
            )}
        </div>
    </div>
  );
}
