
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Todo, Lead } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, GripVertical, Link as LinkIcon, X, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import Link from 'next/link';
import { NewLeadDialog } from '@/app/leads/components/new-lead-dialog';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';


function AddTodoForm({
  onAdd,
  userLeads,
  onAddLeadAndTask,
}: {
  onAdd: (title: string, linkedLead?: { id: string; name: string }) => void;
  userLeads: Lead[];
  onAddLeadAndTask: (newLead: Omit<Lead, 'id' | 'createdAt' | 'ownerName'> & { initialNotes?: string }, callback: (lead: Lead) => void) => void;
}) {
  const [title, setTitle] = useState('');
  const [openLeadSelector, setOpenLeadSelector] = useState(false);
  const [openNewLeadDialog, setOpenNewLeadDialog] = useState(false);
  const [linkedLead, setLinkedLead] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), linkedLead || undefined);
      setTitle('');
      setLinkedLead(null);
    }
  };
  
  const handleLeadCreated = (newLead: Lead) => {
      // This function is the callback that runs after the lead is created
      onAdd(`Seguimiento inicial para ${newLead.name}`, { id: newLead.id, name: newLead.name });
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a new task for an existing lead..."
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
                            setLinkedLead({ id: lead.id, name: lead.name });
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
        </form>
        {linkedLead && (
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-slate-50 p-2 rounded-md">
            <LinkIcon size={14} />
            <span>Linked to: {linkedLead.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto"
              onClick={() => setLinkedLead(null)}
            >
              <X size={14} />
            </Button>
          </div>
        )}
        <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
        </div>
         <NewLeadDialog
            open={openNewLeadDialog}
            onOpenChange={setOpenNewLeadDialog}
            onAddLead={onAddLeadAndTask}
            onLeadCreated={handleLeadCreated}
        >
            <Button variant="outline" className="w-full" onClick={() => setOpenNewLeadDialog(true)}>
                <UserPlus size={16} className="mr-2"/>
                New Task for New Lead
            </Button>
        </NewLeadDialog>
      </CardContent>
    </Card>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  dragHandleProps,
}: {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: any;
}) {

  return (
    <Card className={cn("group transition-shadow hover:shadow-md", todo.completed ? 'bg-slate-50' : 'bg-white')}>
      <CardContent className="p-3 flex items-center gap-3">
        <div {...dragHandleProps}>
            <GripVertical size={16} className={cn("cursor-grab text-slate-300 transition-opacity", todo.completed ? 'opacity-0' : 'opacity-50 group-hover:opacity-100')}/>
        </div>
        <Checkbox
            id={`todo-${todo.id}`}
            checked={todo.completed}
            onCheckedChange={(checked) => onToggle(todo.id, !!checked)}
            className="h-5 w-5"
        />
        <div className="flex-1">
            <label 
                htmlFor={`todo-${todo.id}`}
                className={cn("font-medium cursor-pointer", { 'line-through text-muted-foreground': todo.completed })}
            >
                {todo.title}
            </label>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                 <span>
                    Added {formatDistanceToNow((todo.createdAt as any)?.toDate() || new Date(), { addSuffix: true })}
                </span>
                {todo.leadName && todo.leadId && (
                   <>
                    <span className="text-slate-300">|</span>
                    <Link href={`/leads/${todo.leadId}/notes`} className="flex items-center gap-1 hover:underline text-blue-500">
                        <LinkIcon size={12} /> {todo.leadName}
                    </Link>
                   </>
                )}
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} className="text-destructive h-8 w-8 opacity-50 group-hover:opacity-100">
          <Trash2 size={16} />
        </Button>
      </CardContent>
    </Card>
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
  const { toast } = useToast();
  const [todos, setTodos] = useState(initialTodos);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

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

  const handleAddLeadAndTask = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'> & { initialNotes?: string }, callback: (lead: Lead) => void) => {
    if (!firestore || !user) {
        toast({ title: "Error", description: "Authentication error.", variant: "destructive" });
        return;
    }

    const leadsCollection = collection(firestore, 'leads');
    const finalLeadData = {
        ...newLeadData,
        createdAt: serverTimestamp(),
        ownerName: user.name, // The current user is the owner
    };

    try {
        const { initialNotes, ...leadData } = finalLeadData;
        const newDocRef = await addDoc(leadsCollection, leadData);

        const noteHistoryRef = collection(firestore, 'leads', newDocRef.id, 'noteHistory');
        await addDoc(noteHistoryRef, {
            content: "Lead created via To-Do page.",
            author: user.name,
            date: serverTimestamp(),
            type: 'System',
        });
        
        if (initialNotes) {
             await addDoc(noteHistoryRef, {
                content: initialNotes,
                author: user.name,
                date: serverTimestamp(),
                type: 'Manual',
            });
        }
        
        toast({ title: "Lead Added", description: "New lead created successfully. A task will be added." });
        
        const createdLead: Lead = {
            id: newDocRef.id,
            ...finalLeadData,
            createdAt: new Date(),
        };
        callback(createdLead);

    } catch (error) {
        console.error("Error creating lead:", error);
        toast({ title: "Error creating lead", description: "Could not save the new lead.", variant: "destructive" });
    }
  }, [firestore, user, toast]);

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
    const pending = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    return { pending, completed };
  }, [todos]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
    }

    const newPendingTodos = Array.from(pending);
    const [reorderedItem] = newPendingTodos.splice(source.index, 1);
    newPendingTodos.splice(destination.index, 0, reorderedItem);
    
    setTodos([...newPendingTodos, ...completed]);
  };


  if (loading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-36 w-full" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
          </div>
      )
  }
  
  if (!hasMounted) {
    // Render a simplified version or a skeleton on the server to avoid SSR issues.
    return (
       <div className="space-y-8">
         <AddTodoForm 
            onAdd={handleAddTodo} 
            userLeads={userLeads}
            onAddLeadAndTask={handleAddLeadAndTask}
        />
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <div className="space-y-8">
        <AddTodoForm 
            onAdd={handleAddTodo} 
            userLeads={userLeads}
            onAddLeadAndTask={handleAddLeadAndTask}
        />

        <div className="space-y-4">
            <h3 className="text-lg font-semibold px-1">Tasks - {pending.length}</h3>
            <Droppable droppableId="pending-todos">
                {(provided) => (
                    <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-3"
                    >
                        {pending.length > 0 ? (
                            pending.map((todo, index) => (
                                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <TodoItem
                                                todo={todo}
                                                onToggle={handleToggleTodo}
                                                onDelete={handleDeleteTodo}
                                                dragHandleProps={provided.dragHandleProps}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-slate-50 rounded-lg border border-dashed">
                                <p className="text-muted-foreground font-medium">You're all caught up!</p>
                                <p className="text-sm text-slate-400">Add a new task above to get started.</p>
                            </div>
                        )}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>

        {completed.length > 0 && (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold px-1">Completed - {completed.length}</h3>
                <div className="space-y-3">
                    {completed.map(todo => (
                        <TodoItem
                            key={todo.id}
                            todo={todo}
                            onToggle={handleToggleTodo}
                            onDelete={handleDeleteTodo}
                        />
                    ))}
                </div>
            </div>
        )}
        </div>
    </DragDropContext>
  );
}
