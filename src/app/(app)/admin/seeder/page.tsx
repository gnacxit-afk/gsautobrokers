
'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { articlesToSeed } from '@/lib/knowledge-base-seeder-data';
import { Loader2, BookCheck } from 'lucide-react';
import { AccessDenied } from '@/components/access-denied';

export default function SeederPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeeded, setIsSeeded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useState(() => {
    const checkSeededStatus = async () => {
      if (!firestore) return;
      try {
        const articlesRef = collection(firestore, 'articles');
        // Check if a specific, unique article already exists
        const q = query(articlesRef, where("title", "==", "Misión"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setIsSeeded(true);
        }
      } catch (error) {
        console.error("Error checking seeded status:", error);
      } finally {
        setIsChecking(false);
      }
    };
    checkSeededStatus();
  });

  const handleSeed = async () => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Firestore is not available.', variant: 'destructive' });
      return;
    }
    setIsSeeding(true);

    try {
      const batch = writeBatch(firestore);
      const articlesRef = collection(firestore, 'articles');

      articlesToSeed.forEach(article => {
        const docRef = doc(articlesRef);
        batch.set(docRef, {
            ...article,
            tags: [article.category],
            author: user?.name || 'Admin',
            date: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: 'Knowledge Base Seeded!',
        description: `${articlesToSeed.length} articles have been added to the database.`,
      });
      setIsSeeded(true);
    } catch (error: any) {
      toast({
        title: 'Seeding Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (user?.role !== 'Admin') {
    return <AccessDenied />;
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Content Seeder</h1>
        <p className="text-muted-foreground">
          Use this tool to perform one-time data population for your application.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Knowledge Base Seeder</CardTitle>
          <CardDescription>
            This will populate your Firestore database with all the articles from the training manual. This action should only be performed once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <Skeleton className="h-10 w-full" />
          ) : isSeeded ? (
            <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-green-700">
              <BookCheck className="h-5 w-5" />
              <p className="text-sm font-medium">The knowledge base has already been populated with the training manual articles.</p>
            </div>
          ) : (
            <Button onClick={handleSeed} disabled={isSeeding}>
              {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Seed {articlesToSeed.length} Articles Now
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
