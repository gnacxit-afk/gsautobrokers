
'use client';

import { useParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { VehicleForm } from '../../components/vehicle-form';
import { doc } from 'firebase/firestore';
import type { Vehicle } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

export default function EditVehiclePage() {
  const params = useParams();
  const vehicleId = params.vehicleId as string;
  const firestore = useFirestore();

  const vehicleRef = useMemo(() => firestore ? doc(firestore, 'inventory', vehicleId) : null, [firestore, vehicleId]);
  const { data: vehicle, loading } = useDoc<Vehicle>(vehicleRef);

  if (loading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  if (!vehicle) {
    return <p>Vehicle not found.</p>;
  }

  return <VehicleForm vehicle={vehicle} />;
}

    