
'use client';

import { useMemo } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Lead, Todo } from '@/lib/types';
import { TodoList } from './components/todo-list';

export default function TodosPage() {
  const { user } = useUser();
  const firestore = useFirestore();

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

  const { data: todos, loading: todosLoading } = useCollection<Todo>(todosQuery);
  const { data: userLeads, loading: leadsLoading } = useCollection<Lead>(userLeadsQuery);

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Daily To-Do List</h1>
        <p className="text-muted-foreground">
          Manage your daily tasks and stay organized.
        </p>
      </div>
      <TodoList 
        initialTodos={todos || []} 
        loading={todosLoading || leadsLoading}
        userLeads={userLeads || []}
      />
    </main>
  );
}
