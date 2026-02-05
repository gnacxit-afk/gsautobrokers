'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, getDocs, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { articlesToSeed } from '@/lib/knowledge-base-seeder-data';
import { Loader2, BookCheck, AlertTriangle, UploadCloud } from 'lucide-react';
import { AccessDenied } from '@/components/access-denied';
import { Skeleton } from '@/components/ui/skeleton';

type SeedReport = {
  totalInManual: number;
  syncedCount: number;
  newCount: number;
  updateableCount: number;
};

export default function SeederPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [report, setReport] = useState<SeedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSeededStatus = async () => {
      if (!firestore) return;
      setIsLoading(true);
      try {
        const articlesRef = collection(firestore, 'articles');
        const snapshot = await getDocs(articlesRef);
        const existingArticlesMap = new Map(snapshot.docs.map(doc => [doc.data().title, { id: doc.id, version: doc.data().version || '1.0' }]));

        let newCount = 0;
        let updateableCount = 0;
        let syncedCount = 0;

        for (const seedArticle of articlesToSeed) {
          const existing = existingArticlesMap.get(seedArticle.title);
          if (!existing) {
            newCount++;
          } else if (existing.version !== seedArticle.version) {
            updateableCount++;
          } else {
            syncedCount++;
          }
        }
        
        setReport({
          totalInManual: articlesToSeed.length,
          syncedCount,
          newCount,
          updateableCount
        });
      } catch (error) {
        console.error("Error checking seeded status:", error);
        toast({ title: 'Error', description: 'Could not check knowledge base status.', variant: 'destructive'});
      } finally {
        setIsLoading(false);
      }
    };
    checkSeededStatus();
  }, [firestore, toast]);

  const handleSeed = async () => {
    if (!firestore || !user) {
      toast({ title: 'Error', description: 'Firestore is not available.', variant: 'destructive' });
      return;
    }
    setIsSeeding(true);

    try {
      const articlesRef = collection(firestore, 'articles');
      const snapshot = await getDocs(articlesRef);
      const existingArticlesMap = new Map(snapshot.docs.map(doc => [doc.data().title, { id: doc.id, version: doc.data().version || '1.0' }]));

      const articlesToAdd: typeof articlesToSeed = [];
      const articlesToUpdate: (typeof articlesToSeed[0] & { id: string })[] = [];

      for (const seedArticle of articlesToSeed) {
        const existing = existingArticlesMap.get(seedArticle.title);
        if (!existing) {
          articlesToAdd.push(seedArticle);
        } else if (existing.version !== seedArticle.version) {
          articlesToUpdate.push({ ...seedArticle, id: existing.id });
        }
      }
      
      if (articlesToAdd.length === 0 && articlesToUpdate.length === 0) {
        toast({
          title: 'Knowledge Base is Up to Date',
          description: 'All articles are already synced.',
        });
        setIsSeeding(false);
        return;
      }

      const batch = writeBatch(firestore);

      articlesToAdd.forEach(article => {
        const docRef = doc(articlesRef);
        batch.set(docRef, {
            ...article,
            author: user?.name || 'Admin',
            date: serverTimestamp(),
        });
      });
      
      articlesToUpdate.forEach(article => {
        const docRef = doc(firestore, 'articles', article.id);
        const { id, ...updateData } = article;
        batch.update(docRef, {
            ...updateData,
            author: user?.name || 'Admin',
            date: serverTimestamp(),
        });
      });

      await batch.commit();

      toast({
        title: 'Knowledge Base Updated!',
        description: `${articlesToAdd.length} new articles added, ${articlesToUpdate.length} articles updated.`,
      });
      
      // Re-run the status check to update the UI
      const newSnapshot = await getDocs(articlesRef);
      const newExistingArticlesMap = new Map(newSnapshot.docs.map(doc => [doc.data().title, { id: doc.id, version: doc.data().version || '1.0' }]));
      
      let newCount = 0;
      let updateableCount = 0;
      let syncedCount = 0;

      for (const seedArticle of articlesToSeed) {
        const existing = newExistingArticlesMap.get(seedArticle.title);
        if (!existing) {
          newCount++;
        } else if (existing.version !== seedArticle.version) {
          updateableCount++;
        } else {
          syncedCount++;
        }
      }
      
      setReport({
        totalInManual: articlesToSeed.length,
        syncedCount,
        newCount,
        updateableCount
      });


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
  
  const getButtonText = () => {
    if (!report || isSeeding) return 'Syncing...';
    if (report.newCount === 0 && report.updateableCount === 0) return 'Sync Content';
    
    const parts = [];
    if (report.newCount > 0) parts.push(`Add ${report.newCount} New`);
    if (report.updateableCount > 0) parts.push(`Update ${report.updateableCount}`);
    return parts.join(' & ');
  };


  const renderContent = () => {
    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }
    if (!report) {
        return (
             <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">Could not generate the knowledge base status report.</p>
            </div>
        )
    }
    if (report.newCount === 0 && report.updateableCount === 0) {
        return (
             <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-green-700">
                <BookCheck className="h-5 w-5" />
                <p className="text-sm font-medium">The knowledge base is up to date. ({report.syncedCount}/{report.totalInManual} articles synced)</p>
            </div>
        )
    }
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                <div className="text-sm font-medium">
                  <p>{report.newCount} new articles to add.</p>
                  <p>{report.updateableCount} articles need to be updated.</p>
                </div>
            </div>
            <Button onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {getButtonText()}
            </Button>
        </div>
    )
  }

  return (
    <main>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Content Seeder</h1>
        <p className="text-muted-foreground">
          Use this tool to perform one-time data population for your application.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Knowledge Base Seeder</CardTitle>
          <CardDescription>
            This tool will sync your Firestore database with the articles from the training manual. It adds new articles and updates existing ones if the version has changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2 rounded-lg border bg-slate-50 p-4">
            <h4 className="font-semibold">How to Update the Manual</h4>
            <p className="text-sm text-muted-foreground">
              All training manual content is located in a single file: <code className="font-mono text-xs bg-slate-200 p-1 rounded">src/lib/knowledge-base-seeder-data.ts</code>.
            </p>
            <p className="text-sm text-muted-foreground">
              To update an article, open that file, find the article, and edit its content. It's crucial to also update the <code className="font-mono text-xs bg-slate-200 p-1 rounded">version</code> field to a new number (e.g., from "2.0" to "2.1") for this tool to detect the change.
            </p>
          </div>
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
}
