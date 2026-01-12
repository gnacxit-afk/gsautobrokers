'use client';

import React, { useState, useEffect } from 'react';
import type { EmploymentContract } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Save, X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
  const { user } = useUser();

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
    if (!firestore || !title || !version || !content || !user) {
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
        const batch = writeBatch(firestore);
        const contractsCollection = collection(firestore, 'contracts');
        const newContractRef = doc(contractsCollection);
        
        batch.set(newContractRef, {
          title,
          version,
          content,
          isActive: false, // New contracts are inactive by default
          createdAt: serverTimestamp(),
        });
        
        // Log the creation event
        const eventsCollection = collection(firestore, 'contract_events');
        const newEventRef = doc(eventsCollection);
        batch.set(newEventRef, {
            contractId: newContractRef.id,
            contractTitle: title,
            contractVersion: version,
            userEmail: user.email,
            userName: user.name,
            eventType: 'Created',
            timestamp: serverTimestamp(),
        });
        
        await batch.commit();
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
             <div className="space-y-2">
                <Label>Preview</Label>
                <div className="h-96 border rounded-md p-6 bg-slate-50 overflow-y-auto">
                    <MarkdownRenderer content={content} />
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Contract</Button>
      </CardFooter>
    </Card>
  );
}
