'use client';

import React, { useState } from 'react';
import type { EmploymentContract } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return null;

    const renderMarkdown = (text: string) => {
        let html = text
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-1">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-5 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded-md shadow-sm" />')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
            .replace(/^(-{3,}|\*{3,})$/gm, '<hr class="my-6" />');

        html = html.replace(/^( *[-*+] .*\n?)+/gm, (match) => {
            const items = match.split('\n').filter(Boolean).map(item =>
                `<li>${item.replace(/ *[-*+] /, '')}</li>`
            ).join('');
            return `<ul class="list-disc pl-5 space-y-1">${items}</ul>`;
        });

        html = html.replace(/^( *\d+\. .*\n?)+/gm, (match) => {
            const items = match.split('\n').filter(Boolean).map(item =>
                `<li>${item.replace(/ *\d+\. /, '')}</li>`
            ).join('');
            return `<ol class="list-decimal pl-5 space-y-1">${items}</ol>`;
        });

        html = html.replace(/^(?!<[h1-3|ul|ol|li|hr|img|a]).*$/gm, (match) => {
             if (match.trim() === '') return '';
             return `<p class="text-slate-700 leading-relaxed">${match}</p>`;
        })
        .replace(/<p><\/p>/g, '');

        return { __html: html };
    };

    return (
        <div
            className="prose prose-slate max-w-none space-y-4"
            dangerouslySetInnerHTML={renderMarkdown(content)}
        />
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
        const ipResponse = await fetch('/api/ip');
        if (!ipResponse.ok) {
          throw new Error('Could not verify your location.');
        }
        const { ip } = await ipResponse.json();

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
