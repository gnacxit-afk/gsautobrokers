
"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase";

import type { Lead, NoteEntry, Staff } from "@/lib/types";
import { collection, orderBy, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Edit, ArrowRight, ArrowLeft, MoreHorizontal, Users, ChevronsUpDown, Trash2, CalendarPlus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/lib/auth";
import { Label } from "@/components/ui/label";

const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido"];

const getIconForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return <User size={14} />;
        case 'Stage Change': return <ArrowRight size={14} />;
        case 'Owner Change': return <Edit size={14} />;
        case 'System': return <Bot size={14} />;
        default: return <Bot size={14} />;
    }
};

const getColorForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return "bg-sky-100 text-sky-800";
        case 'Stage Change': return "bg-amber-100 text-amber-800";
        case 'Owner Change': return "bg-purple-100 text-purple-800";
        case 'System': return "bg-slate-100 text-slate-800";
        default: return "bg-slate-100 text-slate-800";
    }
}

export default function LeadDetailsPage() {
  const [newNote, setNewNote] = useState("");
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  const { toast } = useToast();

  const firestore = useFirestore();
  const { user } = useUser();
  const { user: authUser } = useAuthContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const leadDocRef = useMemo(() => firestore && leadId ? doc(firestore, 'leads', leadId) : null, [firestore, leadId]);
  const {data: lead, loading: leadLoading} = useDoc<Lead>(leadDocRef);
  
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const notesQuery = useMemo(() => {
    if (!firestore || !leadId) return null;
    return query(collection(firestore, "leads", leadId, "noteHistory"), orderBy("date", "desc"));
  }, [firestore, leadId]);

  const {data: noteHistory, loading: notesLoading} = useCollection<NoteEntry>(notesQuery);

  const addNoteEntry = useCallback(async (leadId: string, content: string, type: NoteEntry['type'], author?: string) => {
    if (!firestore || !user) return;
    const noteHistoryRef = collection(firestore, 'leads', leadId, 'noteHistory');
    
    await addDoc(noteHistoryRef, {
        content,
        author: author || user.name,
        date: serverTimestamp(),
        type,
    });
    
    const leadRef = doc(firestore, 'leads', leadId);
    await updateDoc(leadRef, { lastActivity: serverTimestamp() });
  }, [firestore, user]);


  const handleSaveNote = useCallback(async () => {
    if (newNote.trim() && leadId && firestore && user) {
        await addNoteEntry(leadId, newNote, 'Manual');
        toast({ title: "Note Saved", description: "Your note has been added to the history." });
        setNewNote("");
    }
  }, [newNote, leadId, firestore, user, addNoteEntry, toast]);
  
  const handleUpdateStage = async (newStage: Lead['stage']) => {
    if (!firestore || !user || !lead) return;
    const leadRef = doc(firestore, 'leads', leadId);
    
    try {
        await updateDoc(leadRef, { stage: newStage });
        let noteContent = `Stage changed from '${lead.stage}' to '${newStage}' by ${user.name}.`;
        await addNoteEntry(leadId, noteContent, 'Stage Change');
        toast({ title: "Stage Updated", description: `Lead stage changed to ${newStage}.` });
    } catch (error) {
         toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
    }
  };

  const handleUpdateOwner = async (newOwnerId: string) => {
      if (!firestore || !user || !lead || !staff) return;
      const newOwner = staff.find(s => s.id === newOwnerId);
      if (!newOwner) return;

      const leadRef = doc(firestore, 'leads', leadId);
      try {
        await updateDoc(leadRef, { ownerId: newOwnerId, ownerName: newOwner.name });
        const noteContent = `Owner changed from '${lead.ownerName}' to '${newOwner.name}' by ${user.name}`;
        await addNoteEntry(leadId, noteContent, 'Owner Change');
        toast({ title: "Owner Updated", description: `${lead.name} is now assigned to ${newOwner.name}.` });
      } catch (error) {
        toast({ title: "Error", description: "Could not update lead owner.", variant: "destructive"});
      }
  };
  
  const handleDelete = async () => {
      if (window.confirm('Are you sure you want to delete this lead?') && firestore && leadId) {
          const leadRef = doc(firestore, 'leads', leadId);
          try {
              await deleteDoc(leadRef);
              toast({ title: "Lead Deleted", description: "The lead has been removed." });
              router.push('/leads');
          } catch (error) {
               toast({ title: "Error Deleting Lead", description: "Could not remove the lead.", variant: "destructive" });
          }
      }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
             if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
             }
        }, 100);
    }
  }, [noteHistory]);

  const loading = leadLoading || notesLoading || staffLoading;
  const assignableStaff = staff?.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin') || [];

  return (
    <main className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4 mb-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/leads')}>
                    <ArrowLeft />
                </Button>
                <div>
                  <h3 className="text-xl font-bold">Lead Details</h3>
                  <div className="text-sm text-muted-foreground">Manage all information and actions for this lead.</div>
                </div>
            </div>
            {lead && (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <MoreHorizontal className="mr-2 h-4 w-4" /> Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Lead Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}/analysis`)}>
                        <Bot className="mr-2 h-4 w-4" /> AI Lead Analysis
                    </DropdownMenuItem>
                     <DropdownMenuItem onSelect={() => router.push(`/calendar?leadId=${lead.id}`)}>
                        <CalendarPlus className="mr-2 h-4 w-4" /> Schedule/Edit Appointment
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ChevronsUpDown className="mr-2 h-4 w-4" /> Update Stage
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup value={lead.stage} onValueChange={(stage) => handleUpdateStage(stage as Lead['stage'])}>
                              {leadStages.map((stage) => (
                                  <DropdownMenuRadioItem key={stage} value={stage}>{stage}</DropdownMenuRadioItem>
                              ))}
                          </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    {(authUser?.role === 'Admin' || authUser?.role === 'Supervisor') && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Users className="mr-2 h-4 w-4" /> Change Owner
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={lead.ownerId} onValueChange={handleUpdateOwner}>
                                  {assignableStaff.map((staffMember) => (
                                      <DropdownMenuRadioItem key={staffMember.id} value={staffMember.id}>{staffMember.name}</DropdownMenuRadioItem>
                                  ))}
                              </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                    )}
                    {authUser?.role === 'Admin' && (
                        <>
                         <DropdownMenuSeparator />
                         <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                          </DropdownMenuItem>
                        </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
        
        {loading ? (
             <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        ) : !lead ? (
            <p>Lead not found.</p>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-4">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Lead Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label>Name</Label>
                            <div className="text-base font-medium">
                                <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10">{lead.name}</Badge>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Phone</Label>
                             <div className="text-base font-medium">
                                <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10">{lead.phone || 'N/A'}</Badge>
                             </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Channel</Label>
                             <div className="text-base font-medium">
                                <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10">{lead.channel}</Badge>
                             </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Stage</Label>
                             <div className="text-base font-medium">
                                <Badge variant={lead.stage === 'Ganado' ? 'default' : 'secondary'} className={cn("text-base py-1 text-primary border-primary/50 bg-primary/10", {
                                    "bg-primary text-primary-foreground": lead.stage === 'Ganado',
                                })}>
                                    {lead.stage}
                                </Badge>
                             </div>
                        </div>
                        <div className="space-y-1">
                            <Label>Owner</Label>
                             <div className="text-base font-medium">
                                <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10">{lead.ownerName}</Badge>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card className="flex flex-col flex-1 max-h-[calc(100vh-14rem)]">
                    <CardHeader>
                        <CardTitle>Notes & History</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1">
                        <ScrollArea className="flex-1 pr-4 -mr-4 mb-4" ref={scrollAreaRef}>
                             <div className="space-y-6">
                                {notesLoading ? (
                                    <>
                                     <Skeleton className="h-16 w-full" />
                                     <Skeleton className="h-16 w-full" />
                                    </>
                                ) : noteHistory && noteHistory.length > 0 ? (
                                    noteHistory.map(note => (
                                        <div key={note.id} className="flex items-start gap-4">
                                            <div className={cn("flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center", getColorForType(note.type))}>
                                                {getIconForType(note.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-bold text-sm text-slate-800">{note.author}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {format((note.date as any)?.toDate ? (note.date as any).toDate() : new Date(note.date as string), 'MMM d, yyyy h:mm a')}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-slate-600">{note.content}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                     <div className="text-center py-10 text-slate-500 h-full flex items-center justify-center">
                                        <p>No notes or history for this lead yet.</p>
                                    </div>
                                )}
                             </div>
                        </ScrollArea>
                        <div className="mt-auto pt-4 border-t">
                             <Textarea
                                placeholder="Add a new note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="mb-2"
                            />
                            <Button onClick={handleSaveNote} className="w-full" disabled={!newNote.trim()}>
                                Save Note
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
           </div>
        )}
    </main>
  );
}
