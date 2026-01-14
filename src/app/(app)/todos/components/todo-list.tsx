'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Todo, Lead, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Plus, ChevronsUpDown, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import Link from 'next/link';
import { NewTaskForNewLeadDialog } from './new-task-for-new-lead-dialog';

interface TodoListProps {
  initialTodos: Todo[];
  loading: boolean;
  userLeads: Lead[];
  allStaff: Staff[];
}

export function TodoList({ initialTodos, loading, userLeads, allStaff }: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isNewLeadTaskOpen, setIsNewLeadTaskOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleAddTodo = async () => {
    if (!newTodo.trim() || !user || !firestore) return;

    try {
      const todosCollection = collection(firestore, 'todos');
      await addDoc(todosCollection, {
        title: newTodo,
        completed: false,
        createdAt: serverTimestamp(),
        userId: user.id,
        leadId: selectedLead?.id || null,
        leadName: selectedLead?.name || null,
      });

      toast({
        title: 'To-Do Added',
        description: 'Your new task has been saved.',
      });
      setNewTodo('');
      setSelectedLead(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not add to-do item.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    if (!firestore) return;
    const todoRef = doc(firestore, 'todos', todo.id);
    await updateDoc(todoRef, { completed: !todo.completed });
  };

  const handleDeleteTodo = async (id: string) => {
    if (!firestore) return;
    const todoRef = doc(firestore, 'todos', id);
    await deleteDoc(todoRef);
    toast({
        title: 'To-Do Removed',
        description: 'The task has been deleted.',
    });
  };
  
  const sortedTodos = useMemo(() => {
    return [...initialTodos].sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        return (b.createdAt?.toDate() as any) - (a.createdAt?.toDate() as any);
    });
  }, [initialTodos]);


  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <CardDescription>Click the checkbox to mark a task as complete.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6 flex-wrap">
          <div className="relative flex-grow min-w-[200px]">
            <Input
                placeholder={selectedLead ? `Task related to ${selectedLead.name}...` : "What needs to be done?"}
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            {selectedLead && (
                <button 
                    onClick={() => setSelectedLead(null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full hover:bg-slate-300"
                >
                    Clear Lead
                </button>
            )}
          </div>
          <div className="flex gap-2">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">Link Lead</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
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
                                    setSelectedLead(lead);
                                    setIsPopoverOpen(false);
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
            <Button onClick={handleAddTodo} disabled={!newTodo.trim()}>
                <Plus className="h-4 w-4 mr-2" /> Add
            </Button>
            <Button variant="secondary" onClick={() => setIsNewLeadTaskOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> New Task for New Lead
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96 pr-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : sortedTodos.length > 0 ? (
            <div className="space-y-4">
              {sortedTodos.map((todo) => (
                <div key={todo.id} className={cn("flex items-center gap-4 p-2 rounded-lg transition-colors", { "hover:bg-slate-50": !todo.completed, "bg-slate-50 opacity-60": todo.completed })}>
                  <Checkbox
                    id={`todo-${todo.id}`}
                    checked={todo.completed}
                    onCheckedChange={() => handleToggleTodo(todo)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={cn('text-sm font-medium leading-none cursor-pointer', {
                        'line-through text-muted-foreground': todo.completed,
                      })}
                    >
                      {todo.title}
                    </label>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-4">
                        <span>
                            Added {formatDistanceToNow(todo.createdAt.toDate(), { addSuffix: true })}
                        </span>
                        {todo.leadId && (
                            <Link href={`/leads/${todo.leadId}/notes`} className="text-blue-600 hover:underline">
                                Linked to: {todo.leadName}
                            </Link>
                        )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTodo(todo.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <p>You're all caught up!</p>
              <p className="text-xs">Add a new task above to get started.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
       <NewTaskForNewLeadDialog
        isOpen={isNewLeadTaskOpen}
        onOpenChange={setIsNewLeadTaskOpen}
        allStaff={allStaff}
      />
    </Card>
  );
}
