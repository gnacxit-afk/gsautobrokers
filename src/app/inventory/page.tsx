'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase/client-provider';

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  let imageUrl = 'https://placehold.co/600x400/f0f2f4/9ca3af?text=GS+Auto';
  if (vehicle.photos && vehicle.photos.length > 0 && vehicle.photos[0]) {
    try {
      new URL(vehicle.photos[0]); 
      imageUrl = vehicle.photos[0];
    } catch (error) {
      // If photos[0] is not a valid URL, imageUrl remains the placeholder.
    }
  }

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
      <Link href={`/inventory/vehicle/${vehicle.id}`}>
        <div className="relative h-60 w-full overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} 
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      </Link>
      <CardContent className="p-4 space-y-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <Link href={`/inventory/vehicle/${vehicle.id}`}>
            <h3 className="text-lg font-bold truncate hover:underline">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
          </Link>
          <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
        </div>
        <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Down Payment</span>
                <span className="text-xl font-bold text-primary">${(vehicle.downPayment || 0).toLocaleString('en-US')}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Cash Price</span>
                <span className="text-sm text-muted-foreground">${(vehicle.cashPrice || 0).toLocaleString('en-US')}</span>
            </div>
        </div>
        <Button asChild className="w-full mt-auto">
          <Link href={`/inventory/vehicle/${vehicle.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}


function PublicInventoryPage() {
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 75000]);
  const [yearRange, setYearRange] = useState([2000, new Date().getFullYear() + 1]);
  const [mileageRange, setMileageRange] = useState([0, 300000]);

  const inventoryQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "inventory"),
      where("status", "==", "Active"),
      orderBy("createdAt", "desc")
    );
  }, [firestore]);

  const { data: vehicles, loading } = useCollection<Vehicle>(inventoryQuery);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(vehicle => {
        const matchesSearch = searchTerm ? 
            `${vehicle.make} ${vehicle.model} ${vehicle.year}`.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        const matchesPrice = vehicle.cashPrice >= priceRange[0] && vehicle.cashPrice <= priceRange[1];
        const matchesYear = vehicle.year >= yearRange[0] && vehicle.year <= yearRange[1];
        const matchesMileage = vehicle.mileage >= mileageRange[0] && vehicle.mileage <= mileageRange[1];
        
        return matchesSearch && matchesPrice && matchesYear && matchesMileage;
    });
  }, [vehicles, searchTerm, priceRange, yearRange, mileageRange]);
  
  const priceMin = 0;
  const priceMax = useMemo(() => vehicles ? Math.max(...vehicles.map(v => v.cashPrice), 75000) : 75000, [vehicles]);
  const yearMin = useMemo(() => vehicles ? Math.min(...vehicles.map(v => v.year), 2000) : 2000, [vehicles]);
  const yearMax = useMemo(() => vehicles ? Math.max(...vehicles.map(v => v.year), new Date().getFullYear() + 1) : new Date().getFullYear() + 1, [vehicles]);
  const mileageMin = 0;
  const mileageMax = useMemo(() => vehicles ? Math.max(...vehicles.map(v => v.mileage), 300000) : 300000, [vehicles]);
  

  return (
    <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-12">
        <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">Our Inventory</h1>
            <p className="mt-2 text-lg text-muted-foreground">Browse our selection of quality pre-owned vehicles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-4 lg:col-span-1">
                <Card className="p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Make, Model..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                     <div className="space-y-3">
                        <label className="text-sm font-medium">Price Range</label>
                        <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            min={priceMin}
                            max={priceMax}
                            step={1000}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${priceRange[0].toLocaleString('en-US')}</span>
                            <span>${priceRange[1].toLocaleString('en-US')}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Year</label>
                        <Slider
                            value={yearRange}
                            onValueChange={setYearRange}
                            min={yearMin}
                            max={yearMax}
                            step={1}
                        />
                         <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{yearRange[0]}</span>
                            <span>{yearRange[1]}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Mileage</label>
                         <Slider
                            value={mileageRange}
                            onValueChange={setMileageRange}
                            min={mileageMin}
                            max={mileageMax}
                            step={5000}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{mileageRange[0].toLocaleString('en-US')} mi</span>
                            <span>{mileageRange[1].toLocaleString('en-US')} mi</span>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="md:col-span-4 lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        [...Array(9)].map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-60 w-full" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-5 w-1/2" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))
                    ) : filteredVehicles && filteredVehicles.length > 0 ? (
                        filteredVehicles.map(vehicle => (
                            <VehicleCard key={vehicle.id} vehicle={vehicle} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16">
                            <h3 className="text-xl font-semibold">No vehicles match your criteria.</h3>
                            <p className="text-muted-foreground">Try adjusting your filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

export default function InventoryPageWithProvider() {
    return (
        <FirebaseClientProvider>
            <PublicInventoryPage />
        </FirebaseClientProvider>
    )
}
