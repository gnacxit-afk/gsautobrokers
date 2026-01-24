'use client';

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@/lib/types";
import { useFirestore, useUser } from "@/firebase";
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statusColors: Record<Vehicle['status'], string> = {
  "Active": "bg-green-100 text-green-800 border-green-200",
  "Pending": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Sold": "bg-slate-100 text-slate-800 border-slate-200",
};

const ColumnActions: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { user } = useUser();

    const handleDelete = async () => {
        if (!firestore || !window.confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) return;

        try {
            await deleteDoc(doc(firestore, 'inventory', vehicle.id));
            toast({ title: 'Vehicle Deleted', description: 'The vehicle has been removed from the inventory.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not delete the vehicle.', variant: 'destructive' });
        }
    };

    const canManage = user?.role === 'Admin' || user?.role === 'Supervisor';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {canManage ? (
                    <>
                        <DropdownMenuItem onSelect={() => router.push(`/inventory/edit/${vehicle.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Vehicle</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export const getColumns = (): ColumnDef<Vehicle>[] => [
    {
        accessorKey: 'photos',
        header: '',
        cell: ({ row }) => {
            const photos = row.getValue('photos') as string[];
            let imageUrl = `https://placehold.co/80x60/f0f2f4/9ca3af?text=${row.original.make.charAt(0)}`;

            if (photos && photos.length > 0 && photos[0]) {
                try {
                    // This will throw an error for invalid URLs, which we catch.
                    new URL(photos[0]); 
                    imageUrl = photos[0];
                } catch (error) {
                    // If photos[0] is not a valid URL, imageUrl remains the placeholder.
                }
            }
            
            return (
                <div className="w-20 h-14 rounded-md overflow-hidden bg-slate-100">
                    <Image src={imageUrl} alt={`${row.original.make} ${row.original.model}`} width={80} height={56} className="object-cover w-full h-full" />
                </div>
            );
        }
    },
    {
        accessorKey: 'make',
        header: 'Vehicle',
        cell: ({ row }) => {
            const vehicle = row.original;
            return (
                <div>
                    <p className="font-bold text-slate-800">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.trim}</p>
                </div>
            )
        }
    },
    {
        accessorKey: 'stockNumber',
        header: 'Stock #',
        cell: ({row}) => {
            const vehicle = row.original;
            return (
                <div className="font-mono text-xs">
                    <p>{vehicle.stockNumber}</p>
                </div>
            )
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as Vehicle['status'];
            return <Badge className={cn("text-xs", statusColors[status])}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'cashPrice',
        header: 'Pricing',
        cell: ({ row }) => {
            const vehicle = row.original;
            const price = vehicle.cashPrice;
            const downPayment = vehicle.downPayment;

            const formattedPrice = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(price);
            const formattedDownPayment = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(downPayment);

            return (
                 <div>
                    <div className="font-semibold">{formattedPrice}</div>
                    <div className="text-xs text-muted-foreground">Down: {formattedDownPayment}</div>
                </div>
            )
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => <ColumnActions vehicle={row.original} />,
    },
];
