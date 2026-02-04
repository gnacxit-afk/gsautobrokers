

'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import type { Lead, Todo, Staff, DailyChecklist } from '@/lib/types';
import { TodoList } from './components/todo-list';
import { DailyChecklistComponent } from './components/daily-checklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function TodosPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const today = format(new Date(), 'yyyy-MM-dd');

  const todosQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'todos'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const userLeadsQuery = useMemo(() => {
    if (!firestore || !user) return null;
     return query(
      collection(firestore, 'leads'),
      where('ownerId', '==', user.id)
    );
  }, [firestore, user]);

  const allStaffQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'staff'));
  }, [firestore, user]);

  const checklistDocRef = useMemo(() => {
      if (!firestore || !user) return null;
      return doc(firestore, `checklists/${user.id}/${today}`);
  }, [firestore, user, today]);

  const { data: todos, loading: todosLoading } = useCollection<Todo>(todosQuery);
  const { data: userLeads, loading: leadsLoading } = useCollection<Lead>(userLeadsQuery);
  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(allStaffQuery);
  const { data: checklistData, loading: checklistLoading } = useDoc<DailyChecklist>(checklistDocRef);


  const loading = todosLoading || leadsLoading || staffLoading || checklistLoading;

  return (
    <main className="flex-1">
        <div className="mb-6">
            <h1 className="text-2xl font-bold">Daily Activity</h1>
            <p className="text-muted-foreground">
            Manage your daily tasks and complete your operational checklist.
            </p>
        </div>
        <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="checklist">Daily Checklist</TabsTrigger>
                <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="checklist">
                <DailyChecklistComponent
                    checklistData={checklistData}
                    loading={loading}
                />
            </TabsContent>
            <TabsContent value="tasks">
                <TodoList
                    initialTodos={todos || []}
                    loading={loading}
                    userLeads={userLeads || []}
                    allStaff={allStaff || []}
                />
            </TabsContent>
        </Tabs>
    </main>
  );
}
