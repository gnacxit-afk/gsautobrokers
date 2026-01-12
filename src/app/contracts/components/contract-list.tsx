'use client';

import type { EmploymentContract } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore, useUser } from '@/firebase';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ContractListProps {
  contracts: EmploymentContract[];
  loading: boolean;
  onEdit: (contract: EmploymentContract) => void;
}

export function ContractList({ contracts, loading, onEdit }: ContractListProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  const handleSetActive = async (contractToActivate: EmploymentContract) => {
    if (!firestore || !user) return;
    
    const batch = writeBatch(firestore);
    
    // Set the new contract as active
    const activeRef = doc(firestore, 'contracts', contractToActivate.id);
    batch.update(activeRef, { isActive: true });
    
    // Deactivate all other contracts
    contracts.forEach(c => {
      if (c.id !== contractToActivate.id && c.isActive) {
        const otherRef = doc(firestore, 'contracts', c.id);
        batch.update(otherRef, { isActive: false });
      }
    });

    // Log the activation event
    const eventsCollection = collection(firestore, 'contract_events');
    const newEventRef = doc(eventsCollection);
    batch.set(newEventRef, {
        contractId: contractToActivate.id,
        contractTitle: contractToActivate.title,
        contractVersion: contractToActivate.version,
        userEmail: user.email,
        userName: user.name,
        eventType: 'Activated',
        timestamp: serverTimestamp(),
    });

    try {
      await batch.commit();
      toast({
        title: "Active Contract Updated",
        description: `"${contractToActivate.title}" is now the active contract for new signatures.`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not set the active contract.",
        variant: "destructive"
      });
    }
  }

  const renderDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return format(jsDate, 'MMM d, yyyy');
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : contracts.length > 0 ? (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.title}</TableCell>
                  <TableCell>{contract.version}</TableCell>
                  <TableCell>
                    {contract.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">
                        <CheckCircle className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{renderDate(contract.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {!contract.isActive && (
                       <Button variant="outline" size="sm" onClick={() => handleSetActive(contract)}>
                         Set Active
                       </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onEdit(contract)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No contract templates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
