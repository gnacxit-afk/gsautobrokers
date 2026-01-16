
'use client';

import { useState, useEffect } from 'react';
import type { KPI } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Save, X } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiClientProps {
  initialKpis: KPI[];
  loading: boolean;
}

export function KpiClient({ initialKpis, loading }: KpiClientProps) {
  const [kpis, setKpis] = useState<KPI[]>(initialKpis);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTarget, setDraftTarget] = useState<string>('');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setKpis(initialKpis);
  }, [initialKpis]);

  const handleEdit = (kpi: KPI) => {
    setEditingId(kpi.id);
    setDraftTarget(kpi.target);
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraftTarget('');
  };

  const handleSave = async (id: string) => {
    if (!firestore) return;
    
    const updatedKpis = kpis.map(kpi =>
      kpi.id === id ? { ...kpi, target: draftTarget } : kpi
    );
    
    const kpisDocRef = doc(firestore, 'kpis', 'kpi-doc');
    try {
        await setDoc(kpisDocRef, { list: updatedKpis });
        setKpis(updatedKpis);
        toast({ title: "KPI Updated", description: "The target has been successfully saved." });
    } catch (error) {
        toast({ title: "Update Failed", description: "Could not save the new target.", variant: "destructive" });
    } finally {
        setEditingId(null);
        setDraftTarget('');
    }
  };
  
  const isAdmin = user?.role === 'Admin';

  if (loading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{kpi.label}</CardTitle>
            <CardDescription>{kpi.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center gap-4">
            {editingId === kpi.id ? (
              <Input
                value={draftTarget}
                onChange={(e) => setDraftTarget(e.target.value)}
                className="text-3xl font-bold h-14 text-center"
              />
            ) : (
              <p className="text-3xl font-bold text-primary">{kpi.target}</p>
            )}

            {isAdmin && (
              <div className="flex items-center gap-2">
                {editingId === kpi.id ? (
                  <>
                    <Button size="sm" onClick={() => handleSave(kpi.id)}>
                      <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(kpi)}
                  >
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Target
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
