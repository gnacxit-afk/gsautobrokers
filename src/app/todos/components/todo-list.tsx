
"use client";

import { useState, useMemo } from 'react';
import type { Todo, Lead } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical, Link as LinkIcon, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import Link from 'next/link';

function AddTodoForm({ 
    onAdd,
    userLeads
}: { 
    onAdd: (title: string, linkedLead?: { id: string; name: string }) => void,
    userLeads: Lead[]
}) {
  const [title, setTitle] = useState('');
  const [openLeadSelector, setOpenLeadSelector] = useState(false);
  const [linkedLead, setLinkedLead] = useState<{id: string, name: string} | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), linkedLead || undefined);
      setTitle('');
      setLinkedLead(null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
            <CardContent className="p-4">
                 <div className="flex items-center gap-2">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-1"
                    />
                    <Popover open={openLeadSelector} onOpenChange={setOpenLeadSelector}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" title="Link to a Lead">
                                <LinkIcon size={16} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[250px]">
                            <Command>
                                <CommandInput placeholder="Search lead..." />
                                <CommandList>
                                <CommandEmpty>No leads found.</CommandEmpty>
                                <CommandGroup>
                                    {userLeads.map((lead) => (
                                    <CommandItem
                                        key={lead.id}
                                        value={lead.name}
                                        onSelect={() => {
                                            setLinkedLead({id: lead.id, name: lead.name});
                                            setOpenLeadSelector(false);
                                        }}
                                    >
                                        {lead.name}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Button type="submit" size="icon">
                        <Plus size={16} />
                    </Button>
                </div>
                 {linkedLead && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-md">
                        <LinkIcon size={14} />
                        <span>Linked to: {linkedLead.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setLinkedLead(null)}>
                            <X size={14} />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </form>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {

  return (
    <div className={cn("flex items-center gap-3 p-4 rounded-lg transition-colors", 
        todo.completed ? 'bg-slate-50 text-muted-foreground' : 'bg-white hover:bg-slate-50'
    )}>
       <Checkbox
            id={`todo-${todo.id}`}
            checked={todo.completed}
            onCheckedChange={(checked) => onToggle(todo.id, !!checked)}
            className="h-5 w-5"
        />
        <div className="flex-1">
            <label 
                htmlFor={`todo-${todo.id}`}
                className={cn("font-medium cursor-pointer", { 'line-through': todo.completed })}
            >
                {todo.title}
            </label>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                 <span>
                    Added {formatDistanceToNow((todo.createdAt as any)?.toDate() || new Date(), { addSuffix: true })}
                </span>
                {todo.leadName && (
                   <>
                    <span className="text-slate-300">|</span>
                    <Link href={`/leads/${todo.leadId}`} className="flex items-center gap-1 hover:underline text-blue-500">
                        <LinkIcon size={12} /> {todo.leadName}
                    </Link>
                   </>
                )}
            </div>
        </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} className="text-destructive h-8 w-8">
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

export function TodoList({ 
    initialTodos,
    loading,
    userLeads,
}: { 
    initialTodos: Todo[],
    loading: boolean,
    userLeads: Lead[]
}) {
  const firestore = useFirestore();
  const { user } = useUser();

  const handleAddTodo = async (title: string, linkedLead?: {id: string, name: string}) => {
    if (!firestore || !user) return;
    const todosCollection = collection(firestore, 'todos');
    await addDoc(todosCollection, {
      title,
      completed: false,
      createdAt: serverTimestamp(),
      userId: user.id,
      leadId: linkedLead?.id || '',
      leadName: linkedLead?.name || '',
    });
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    if (!firestore) return;
    const todoRef = doc(firestore, 'todos', id);
    await updateDoc(todoRef, { completed });
  };

  const handleDeleteTodo = async (id: string) => {
    if (!firestore) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
        const todoRef = doc(firestore, 'todos', id);
        await deleteDoc(todoRef);
    }
  };

  const { pending, completed } = useMemo(() => {
    const pending = initialTodos.filter(t => !t.completed);
    const completed = initialTodos.filter(t => t.completed);
    return { pending, completed };
  }, [initialTodos]);


  if (loading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <AddTodoForm onAdd={handleAddTodo} userLeads={userLeads} />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold px-4">Tasks - {pending.length}</h3>
        <Card>
            <CardContent className="p-2 divide-y">
                {pending.length > 0 ? (
                    pending.map(todo => (
                        <TodoItem
                            key={todo.id}
                            todo={todo}
                            onToggle={handleToggleTodo}
                            onDelete={handleDeleteTodo}
                        />
                    ))
                ) : (
                    <p className="text-muted-foreground text-center p-8">You're all caught up!</p>
                )}
            </CardContent>
        </Card>
      </div>

      {completed.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold px-4">Completed - {completed.length}</h3>
            <Card>
                <CardContent className="p-2 divide-y">
                    {completed.map(todo => (
                    <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={handleToggleTodo}
                        onDelete={handleDeleteTodo}
                    />
                    ))}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

