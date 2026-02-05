
"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useUser, useCollection, useDoc } from "@/firebase";

import type { Lead, NoteEntry, Staff, Dealership, Vehicle } from "@/lib/types";
import { collection, orderBy, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Edit, ArrowLeft, MoreHorizontal, Users, ChevronsUpDown, Trash2, Edit2, Save, X, Calendar, Building, Car, Link2, XCircle, Wand2, Loader2 } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/lib/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { addNoteEntry } from "@/lib/utils";
import { generateFollowup } from "@/ai/flows/generate-followup-flow";
import { SendWhatsappDialog } from "../../components/send-whatsapp-dialog";


const leadStages: Lead['stage'][] = ["Nuevo", "Calificado", "Citado", "En Seguimiento", "Ganado", "Perdido", "No Show"];

const getIconForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return <User size={14} />;
        case 'Stage Change': return <ChevronsUpDown size={14} />;
        case 'Owner Change': return <Users size={14} />;
        case 'Dealership Change': return <Building size={14} />;
        case 'Vehicle Link': return <Car size={14} />;
        case 'System': return <Bot size={14} />;
        case 'AI Analysis': return <Bot size={14} />;
        default: return <Bot size={14} />;
    }
};

const getColorForType = (type: NoteEntry['type']) => {
    switch (type) {
        case 'Manual': return "bg-sky-100 text-sky-800";
        case 'Stage Change': return "bg-amber-100 text-amber-800";
        case 'Owner Change': return "bg-purple-100 text-purple-800";
        case 'Dealership Change': return 'bg-pink-100 text-pink-800';
        case 'Vehicle Link': return 'bg-teal-100 text-teal-800';
        case 'System': return "bg-slate-100 text-slate-800";
        case 'AI Analysis': return "bg-violet-100 text-violet-800";
        default: return "bg-slate-100 text-slate-800";
    }
}

export default function LeadDetailsPage() {
  const [newNote, setNewNote] = useState("");
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [draftData, setDraftData] = useState<{name: string, phone: string, dealershipId: string}>({ name: '', phone: '', dealershipId: '' });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);


  const firestore = useFirestore();
  const { user } = useUser();
  const { user: authUser } = useAuthContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const leadDocRef = useMemo(() => firestore && leadId ? doc(firestore, 'leads', leadId) : null, [firestore, leadId]);
  const {data: lead, loading: leadLoading} = useDoc<Lead>(leadDocRef);
  
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const dealershipsQuery = useMemo(() => firestore ? collection(firestore, 'dealerships') : null, [firestore]);
  const { data: dealerships, loading: dealershipsLoading } = useCollection<Dealership>(dealershipsQuery);

  const inventoryQuery = useMemo(() => firestore ? query(collection(firestore, 'inventory'), where('status', '==', 'Active')) : null, [firestore]);
  const { data: inventory, loading: inventoryLoading } = useCollection<Vehicle>(inventoryQuery);

  const interestedVehicleRef = useMemo(() => (firestore && lead?.interestedVehicleId) ? doc(firestore, 'inventory', lead.interestedVehicleId) : null, [firestore, lead]);
  const { data: interestedVehicle, loading: vehicleLoading } = useDoc<Vehicle>(interestedVehicleRef);

  const notesQuery = useMemo(() => {
    if (!firestore || !leadId) return null;
    return query(collection(firestore, "leads", leadId, "noteHistory"), orderBy("date", "desc"));
  }, [firestore, leadId]);

  const {data: noteHistory, loading: notesLoading} = useCollection<NoteEntry>(notesQuery);

  useEffect(() => {
    if (lead) {
      setDraftData({ name: lead.name, phone: lead.phone || '', dealershipId: lead.dealershipId });
    }
  }, [lead]);
  
  const handleGenerateFollowup = async () => {
    if (!lead || !noteHistory || !user) return;
    setIsGenerating(true);
    try {
        const result = await generateFollowup({
            leadDetails: JSON.stringify({ ...lead, brokerName: user.name }),
            conversationHistory: JSON.stringify(noteHistory),
            vehicleDetails: interestedVehicle ? JSON.stringify(interestedVehicle) : undefined,
        });
        setAiMessage(result.whatsappMessage);
        setIsWhatsAppDialogOpen(true);
    } catch (error) {
        console.error("Error generating AI follow-up:", error);
        toast({ title: 'AI Assistant Error', description: 'Could not generate follow-up message.', variant: 'destructive' });
    } finally {
        setIsGenerating(false);
    }
  };


  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling, reset draft data to original lead data
      if (lead) {
        setDraftData({ name: lead.name, phone: lead.phone || '', dealershipId: lead.dealershipId });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setDraftData(prev => ({...prev, [id]: value}));
  };

  const handleSaveChanges = async () => {
    if (!firestore || !user || !lead || !dealerships) return;

    const batch = writeBatch(firestore);
    const leadRef = doc(firestore, 'leads', lead.id);

    const updates: Partial<Lead> = {};
    const changes: string[] = [];
    let shouldUpdateAppointments = false;

    if (lead.name !== draftData.name) {
      updates.name = draftData.name;
      changes.push(`Name changed from '${lead.name}' to '${draftData.name}'`);
      shouldUpdateAppointments = true;
    }
    if ((lead.phone || '') !== draftData.phone) {
      updates.phone = draftData.phone;
      changes.push(`Phone changed from '${lead.phone || 'N/A'}' to '${draftData.phone}'`);
    }
    if (lead.dealershipId !== draftData.dealershipId) {
        const newDealership = dealerships.find(d => d.id === draftData.dealershipId);
        if (newDealership) {
            updates.dealershipId = newDealership.id;
            updates.dealershipName = newDealership.name;
            changes.push(`Dealership changed from '${lead.dealershipName}' to '${newDealership.name}'`);
        }
    }


    if (changes.length === 0) {
      toast({ title: "No Changes", description: "No information was modified." });
      setIsEditing(false);
      return;
    }

    batch.update(leadRef, updates);

    try {
      if (shouldUpdateAppointments) {
        const appointmentsQuery = query(collection(firestore, 'appointments'), where("leadId", "==", lead.id));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
          batch.update(appointmentDoc.ref, { leadName: draftData.name });
        });
      }

      await batch.commit();

      const noteContent = `Lead information updated by ${user.name}: ${changes.join('. ')}.`;
      await addNoteEntry(firestore, user, lead.id, noteContent, 'System');

      toast({ title: "Lead Updated", description: "The lead's information has been saved." });
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Update Failed", description: "Could not save changes.", variant: "destructive" });
    }
  };


  const handleSaveNote = useCallback(async () => {
    if (newNote.trim() && leadId && firestore && user) {
        await addNoteEntry(firestore, user, leadId, newNote, 'Manual');
        toast({ title: "Note Saved", description: "Your note has been added to the history." });
        setNewNote("");
    }
  }, [newNote, leadId, firestore, user, toast]);
  
  const handleUpdateStage = async (newStage: Lead['stage']) => {
    if (!firestore || !user || !lead) return;

    const batch = writeBatch(firestore);
    const leadRef = doc(firestore, 'leads', leadId);

    try {
        batch.update(leadRef, { stage: newStage });

        const appointmentsQuery = query(collection(firestore, 'appointments'), where("leadId", "==", lead.id));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
            batch.update(appointmentDoc.ref, { stage: newStage });
        });
        
        await batch.commit();
        
        let noteContent = `Stage changed from '${lead.stage}' to '${newStage}' by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Stage Change');
        toast({ title: "Stage Updated", description: `Lead stage and appointment statuses changed to ${newStage}.` });

    } catch (error) {
         toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
    }
  };

  const handleUpdateOwner = async (newOwnerId: string) => {
      if (!firestore || !user || !lead || !staff) return;
      const newOwner = staff.find(s => s.id === newOwnerId);
      if (!newOwner) return;

      const batch = writeBatch(firestore);
      const leadRef = doc(firestore, 'leads', leadId);

      try {
        batch.update(leadRef, { ownerId: newOwnerId, ownerName: newOwner.name });
        
        const appointmentsQuery = query(collection(firestore, 'appointments'), where("leadId", "==", lead.id));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
            batch.update(appointmentDoc.ref, { ownerId: newOwnerId });
        });

        await batch.commit();

        const noteContent = `Owner changed from '${lead.ownerName}' to '${newOwner.name}' by ${user.name}`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Owner Change');
        toast({ title: "Owner Updated", description: `${lead.name} and all related appointments are now assigned to ${newOwner.name}.` });
      } catch (error) {
        toast({ title: "Error", description: "Could not update lead owner.", variant: "destructive"});
      }
  };

  const handleUpdateDealership = async (newDealershipId: string) => {
    if (!firestore || !user || !lead || !dealerships) return;
    const newDealership = dealerships.find(d => d.id === newDealershipId);
    if (!newDealership) return;

    const leadRef = doc(firestore, 'leads', leadId);
    try {
        await updateDoc(leadRef, {
            dealershipId: newDealership.id,
            dealershipName: newDealership.name,
        });

        const noteContent = `Dealership changed from '${lead.dealershipName}' to '${newDealership.name}' by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Dealership Change');
        toast({ title: "Dealership Updated", description: `${lead.name} is now assigned to ${newDealership.name}.` });
    } catch (error) {
        toast({ title: "Error", description: "Could not update lead dealership.", variant: "destructive"});
    }
  };

  const handleLinkVehicle = async (vehicleId: string) => {
    if (!firestore || !user || !lead) return;
    const vehicle = inventory?.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const leadRef = doc(firestore, 'leads', lead.id);
    try {
        await updateDoc(leadRef, { interestedVehicleId: vehicleId });
        const noteContent = `Vehicle "${vehicle.year} ${vehicle.make} ${vehicle.model}" linked by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Vehicle Link');
        toast({ title: 'Vehicle Linked' });
    } catch (error) {
         toast({ title: 'Error', description: 'Could not link vehicle.', variant: 'destructive' });
    }
  };

  const handleUnlinkVehicle = async () => {
    if (!firestore || !user || !lead) return;
    const leadRef = doc(firestore, 'leads', lead.id);
    try {
        await updateDoc(leadRef, { interestedVehicleId: null });
        const noteContent = `Vehicle unlinked by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Vehicle Link');
        toast({ title: 'Vehicle Unlinked' });
    } catch (error) {
         toast({ title: 'Error', description: 'Could not unlink vehicle.', variant: 'destructive' });
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

  const loading = leadLoading || notesLoading || staffLoading || dealershipsLoading || inventoryLoading || vehicleLoading;
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
                     <DropdownMenuItem onSelect={() => router.push(`/appointments?leadId=${lead.id}`)}>
                        <Calendar className="mr-2 h-4 w-4" /> Schedule Appointment
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ChevronsUpDown className="mr-2 h-4 w-4" /> Update Stage
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup value={lead.stage} onValueChange={(stage) => handleUpdateStage(stage as Lead['stage'])}>
                              {leadStages.map((stage) => {
                                  const isBrokerRestricted = authUser?.role === 'Broker' && (stage === 'Ganado' || stage === 'Perdido');
                                  return (
                                    <DropdownMenuRadioItem key={stage} value={stage} disabled={isBrokerRestricted}>
                                        {stage}
                                    </DropdownMenuRadioItem>
                                  );
                              })}
                          </DropdownMenuRadioGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    {(authUser?.role === 'Admin' || authUser?.role === 'Supervisor') && (
                      <>
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
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Building className="mr-2 h-4 w-4" /> Change Dealership
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={lead.dealershipId} onValueChange={handleUpdateDealership}>
                                  {(dealerships || []).map((dealership) => (
                                      <DropdownMenuRadioItem key={dealership.id} value={dealership.id}>{dealership.name}</DropdownMenuRadioItem>
                                  ))}
                              </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </>
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
           <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Lead Information</CardTitle>
                            {isEditing ? (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditToggle}>
                                <X size={16}/>
                                </Button>
                                <Button size="sm" onClick={handleSaveChanges}>
                                <Save size={14} className="mr-2" /> Save
                                </Button>
                            </div>
                            ) : (
                            <Button variant="outline" size="sm" onClick={handleEditToggle}>
                                <Edit2 size={14} className="mr-2" /> Edit
                            </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Name</Label>
                                {isEditing ? (
                                    <Input id="name" value={draftData.name} onChange={handleDraftChange} />
                                ) : (
                                    <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10 w-full justify-start">{lead.name}</Badge>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                {isEditing ? (
                                    <Input id="phone" value={draftData.phone} onChange={handleDraftChange} />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10 w-full justify-start">{lead.phone || 'N/A'}</Badge>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Channel</Label>
                                <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10 w-full justify-start">{lead.channel}</Badge>
                            </div>
                            <div className="space-y-2">
                                <Label>Stage</Label>
                                <Badge variant={lead.stage === 'Ganado' ? 'default' : 'outline'} className={cn("text-base py-1 w-full justify-start", {
                                    "bg-primary text-primary-foreground": lead.stage === 'Ganado',
                                    "text-primary border-primary/50 bg-primary/10": lead.stage !== 'Ganado'
                                })}>
                                    {lead.stage}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <Label>Owner</Label>
                                <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10 w-full justify-start">{lead.ownerName}</Badge>
                            </div>
                            <div className="space-y-2">
                                <Label>Dealership</Label>
                                {isEditing ? (
                                    <Select value={draftData.dealershipId} onValueChange={(value) => setDraftData(prev => ({...prev, dealershipId: value}))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a dealership" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(dealerships || []).map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant="outline" className="text-base py-1 text-primary border-primary/50 bg-primary/10 w-full justify-start">{lead.dealershipName}</Badge>
                                )}
                            </div>
                             {lead.stage === 'Ganado' && lead.brokerCommission && (
                                <div className="space-y-2">
                                    <Label>Broker Commission</Label>
                                    <Badge variant="outline" className="text-base py-1 text-green-600 border-green-200 bg-green-50 w-full justify-start">${lead.brokerCommission.toLocaleString('en-US')}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Vehicle of Interest</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Skeleton className="h-24 w-full" /> : 
                            interestedVehicle ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Image src={interestedVehicle.photos?.[0] || `https://placehold.co/80x60/f0f2f4/9ca3af?text=GS`} alt="Vehicle" width={80} height={60} className="rounded-md object-cover" />
                                        <div>
                                            <p className="font-semibold">{interestedVehicle.year} {interestedVehicle.make} {interestedVehicle.model}</p>
                                            <p className="text-sm text-muted-foreground">${interestedVehicle.cashPrice.toLocaleString('en-US')}</p>
                                        </div>
                                    </div>
                                    {lead.stage !== 'Ganado' && (
                                        <Button variant="outline" size="sm" className="w-full" onClick={handleUnlinkVehicle}><XCircle size={14} className="mr-2"/> Unlink Vehicle</Button>
                                    )}
                                </div>
                            ) : lead.stage !== 'Ganado' ? (
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full"><Link2 size={14} className="mr-2"/>Link Vehicle</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search inventory..." />
                                            <CommandList>
                                                <CommandEmpty>No vehicles found.</CommandEmpty>
                                                <CommandGroup>
                                                    {(inventory || []).map((vehicle) => (
                                                        <CommandItem key={vehicle.id} value={vehicle.id} onSelect={() => handleLinkVehicle(vehicle.id)}>
                                                            {vehicle.year} {vehicle.make} {vehicle.model} - ${vehicle.cashPrice.toLocaleString('en-US')}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Sale completed.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wand2 size={18} /> AI Sales Copilot</CardTitle>
                             <CardDescription>Generate a contextual follow-up message for this lead.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button onClick={handleGenerateFollowup} className="w-full" disabled={isGenerating}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot size={16} className="mr-2" />}
                                Generate WhatsApp Follow-up
                             </Button>
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
            <SendWhatsappDialog 
                lead={lead}
                isOpen={isWhatsAppDialogOpen}
                onClose={() => setIsWhatsAppDialogOpen(false)}
                initialMessage={aiMessage}
            />
           </>
        )}
    </main>
  );
}
