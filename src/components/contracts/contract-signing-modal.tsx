'use client';

import React, { useState } from 'react';
import type { EmploymentContract } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


function MarkdownRenderer({ content }: { content: string }) {
  const renderLine = (line: string, index: number) => {
    if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold mt-6 mb-3">{line.substring(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-semibold mt-5 mb-2">{line.substring(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold mt-4 mb-1">{line.substring(4)}</h3>;
    if (line.trim() === '---') return <hr key={index} className="my-6" />;
    if (line.startsWith('- ')) return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    return <p key={index}>{line}</p>;
  };

  return (
    <div className="prose prose-slate max-w-none whitespace-pre-wrap space-y-3">
      {content.split('\n').map(renderLine)}
    </div>
  );
}

interface ContractSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: EmploymentContract;
}

export function ContractSigningModal({ isOpen, onClose, contract }: ContractSigningModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSign = async () => {
    if (!user || !firestore) {
        toast({ title: 'Error', description: 'You must be logged in to sign.', variant: 'destructive'});
        return;
    }
    
    setIsSigning(true);
    try {
        // Fetch the user's IP address from our API endpoint
        const ipResponse = await fetch('/api/ip');
        if (!ipResponse.ok) {
          throw new Error('Could not verify your location.');
        }
        const { ip } = await ipResponse.json();

        // Create a new signature document directly on the client
        const signaturesCollection = collection(firestore, "signatures");
        const signatureData = {
          userId: user.id,
          userName: user.name,
          contractId: contract.id,
          contractVersion: contract.version,
          signedAt: serverTimestamp(),
          ipAddress: ip,
        };

        await addDoc(signaturesCollection, signatureData);
        
        toast({
            title: 'Contract Signed!',
            description: 'Thank you. Your signature has been recorded.',
        });
        onClose();

    } catch (error: any) {
        toast({
            title: 'Signing Failed',
            description: error.message || 'An error occurred while signing the contract.',
            variant: 'destructive',
        });
    } finally {
        setIsSigning(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review and Sign: {contract.title}</DialogTitle>
          <DialogDescription>
            Please read the following document carefully before signing.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 border rounded-md p-6 bg-slate-50">
           <MarkdownRenderer content={contract.content} />
        </ScrollArea>
        <DialogFooter className="flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" checked={isChecked} onCheckedChange={(checked) => setIsChecked(!!checked)} />
            <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I have read and agree to the terms of this contract.
            </Label>
          </div>
          <Button 
            type="button" 
            onClick={handleSign}
            disabled={!isChecked || isSigning}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSigning ? 'Signing...' : 'Accept & Sign Contract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
