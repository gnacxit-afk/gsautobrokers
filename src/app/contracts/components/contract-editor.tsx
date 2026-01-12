'use client';

import React, { useState, useEffect } from 'react';
import type { EmploymentContract } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, X } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ContractEditorProps {
  contract: EmploymentContract | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ContractEditor({ contract, onSave, onCancel }: ContractEditorProps) {
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (contract) {
      setTitle(contract.title);
      setVersion(contract.version);
      setContent(contract.content);
    } else {
      // Defaults for a new contract
      setTitle('');
      setVersion('1.0');
      setContent('## Employment Agreement\n\nEnter contract text here. Use Markdown for formatting.');
    }
  }, [contract]);

  const handleSave = async () => {
    if (!firestore || !title || !version || !content) {
      toast({ title: 'Missing Fields', description: 'Please fill out all fields.', variant: 'destructive'});
      return;
    }

    try {
      if (contract) {
        // Update existing contract
        const contractRef = doc(firestore, 'contracts', contract.id);
        await updateDoc(contractRef, { title, version, content });
        toast({ title: 'Contract Updated', description: 'The contract template has been saved.'});
      } else {
        // Create new contract
        const contractsCollection = collection(firestore, 'contracts');
        await addDoc(contractsCollection, {
          title,
          version,
          content,
          isActive: false, // New contracts are inactive by default
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Contract Created', description: 'The new contract template has been added.'});
      }
      onSave();
    } catch (error) {
      console.error("Error saving contract: ", error);
      toast({ title: 'Save Failed', description: 'Could not save the contract template.', variant: 'destructive'});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{contract ? 'Edit Contract' : 'Create New Contract'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Contract Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Broker Services Agreement" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g., 1.0" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea 
            id="content" 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            className="h-96 font-mono"
            placeholder="Enter contract text here..."
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Contract</Button>
      </CardFooter>
    </Card>
  );
}
