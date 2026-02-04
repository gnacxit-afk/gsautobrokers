
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, writeBatch, getDocs, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { articlesToSeed } from '@/lib/knowledge-base-seeder-data';
import { Loader2, BookCheck, AlertTriangle } from 'lucide-react';
import { AccessDenied } from '@/components/access-denied';
import { Skeleton } from '@/components/ui/skeleton';

type SeedReport = {
  totalInManual: number;
  seededCount: number;
  missingCount: number;
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
        const existingTitles = new Set(snapshot.docs.map(doc => doc.data().title));
        
        const totalInManual = articlesToSeed.length;
        const seededCount = Array.from(existingTitles).filter(title => 
            articlesToSeed.some(seedArticle => seedArticle.title === title)
        ).length;
        const missingCount = totalInManual - seededCount;

        setReport({ totalInManual, seededCount, missingCount });
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
      const existingTitles = new Set(snapshot.docs.map(doc => doc.data().title));

      const articlesToAdd = articlesToSeed.filter(article => !existingTitles.has(article.title));
      
      if (articlesToAdd.length === 0) {
        toast({
          title: 'Knowledge Base is Up to Date',
          description: 'All articles from the manual are already in the database.',
        });
        if(report) {
            setReport({...report, missingCount: 0});
        }
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

      await batch.commit();

      toast({
        title: 'Knowledge Base Seeded!',
        description: `${articlesToAdd.length} new articles have been added to the database.`,
      });
      
      // Update report after seeding
      if (report) {
        setReport(prev => ({
            ...prev!,
            seededCount: prev!.seededCount + articlesToAdd.length,
            missingCount: prev!.missingCount - articlesToAdd.length,
        }));
      }

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
    if (report.missingCount === 0) {
        return (
             <div className="flex items-center gap-2 rounded-md bg-green-50 p-4 text-green-700">
                <BookCheck className="h-5 w-5" />
                <p className="text-sm font-medium">The knowledge base is up to date. ({report.seededCount}/{report.totalInManual} articles synced)</p>
            </div>
        )
    }
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">
                    {report.missingCount} articles from the manual are missing. ({report.seededCount}/{report.totalInManual} synced)
                </p>
            </div>
            <Button onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Seed {report.missingCount} Missing Articles
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
            This will populate your Firestore database with all the articles from the training manual. It will skip any articles that already exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </main>
  );
}
