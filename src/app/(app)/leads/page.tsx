"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "@/app/(app)/leads/components/data-table";
import type { Lead, Staff, Dealership } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useFirestore, useUser, useCollection } from "@/firebase";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  type SortingState,
} from "@tanstack/react-table";
import {
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
  limit,
  type QueryConstraint,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, isValid } from "date-fns";
import { addNoteEntry, createNotification } from "@/lib/utils";
import { matchSorter } from 'match-sorter';
import { SendWhatsappDialog } from "./components/send-whatsapp-dialog";

function LeadsPageContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dateRange } = useDateRange();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastActivity", desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const [expanded, setExpanded] = useState({});
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  
  // Structured filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{key: string; value: string}[]>([]);

  /* ------------------------------ data fetching ----------------------------- */
  const staffQuery = useMemo(
    () => (firestore ? query(collection(firestore, "staff")) : null),
    [firestore]
  );
  const dealershipsQuery = useMemo(
    () => (firestore ? query(collection(firestore, "dealerships")) : null),
    [firestore]
  );
  
  const { data: staffSnapshot, loading: staffLoading } = useCollection<Staff>(staffQuery);
  const { data: dealershipsSnapshot, loading: dealershipsLoading } = useCollection<Dealership>(dealershipsQuery);

  const staffData = useMemo(() => staffSnapshot || [], [staffSnapshot]);
  const dealershipsData = useMemo(() => dealershipsSnapshot || [], [dealershipsSnapshot]);


  /* ---------------------- SERVER-SIDE ROLE-BASED QUERY ---------------------- */
  const leadsQuery = useMemo(() => {
    if (!firestore || !user || !staffData.length) return null;

    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(250)];

    // Role-based pre-filtering
    if (user.role === "Broker") {
      constraints.push(where("ownerId", "==", user.id));
    } else if (user.role === 'Supervisor') {
        const teamIds = staffData.filter(s => s.supervisorId === user.id).map(s => s.id);
        if (teamIds.length > 0) {
            constraints.push(where("ownerId", "in", [...teamIds, user.id]));
        } else {
            constraints.push(where("ownerId", "==", user.id));
        }
    }
    
    // Server-side filtering from active chips
    activeFilters.forEach(f => {
      constraints.push(where(f.key, '==', f.value));
    });

    return query(collection(firestore, "leads"), ...constraints);
  }, [firestore, user, staffData, activeFilters]);

  const { data: leadsSnapshot, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

  /* --------------------------- CLIENT-SIDE FILTERING --------------------------- */
  const filteredData = useMemo(() => {
    if (!leadsSnapshot) return [];
    
    let data = leadsSnapshot;

    // 1. Date Range Filter
    if (dateRange?.start && dateRange?.end) {
      data = data.filter(lead => {
        const date = (lead.createdAt as any)?.toDate?.() ?? new Date(lead.createdAt as any);
        return isValid(date) && isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      });
    }

    // 2. Free Text "Fuzzy" Search
    if (searchTerm) {
       data = matchSorter(data, searchTerm, {
        keys: ['name', 'phone', 'email'],
      });
    }
      
    return data;
  }, [leadsSnapshot, searchTerm, dateRange]);

  /* -------------------------------- ACTIONS ------------------------------- */

  const handleUpdateStage = useCallback(async (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => {
    if (!firestore || !user) return;
    const leadRef = doc(firestore, 'leads', leadId);
    const lead = leadsSnapshot?.find(l => l.id === leadId);

    if (!lead) return;
    
    const batch = writeBatch(firestore);
    try {
        batch.update(leadRef, { stage: newStage, lastActivity: serverTimestamp() });

        const appointmentsQuery = query(collection(firestore, 'appointments'), where("leadId", "==", leadId));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
            batch.update(appointmentDoc.ref, { stage: newStage });
        });

        await batch.commit();

        let noteContent = `Stage changed from '${oldStage}' to '${newStage}' by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Stage Change');
        
        if (lead.ownerId !== user.id) {
            await createNotification(
                firestore,
                lead.ownerId,
                lead,
                `Stage for lead ${lead.name} was changed to ${newStage} by ${user.name}.`,
                user.name
            );
        }
        toast({ title: "Stage Updated", description: `Lead stage and appointment statuses changed to ${newStage}.` });
    } catch (error) {
         console.error("Error updating stage:", error);
         toast({ title: "Error", description: "Could not update lead stage.", variant: "destructive"});
    }
  }, [firestore, user, toast, leadsSnapshot]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?') && firestore) {
        const leadRef = doc(firestore, 'leads', id);
        try {
            await deleteDoc(leadRef);
            toast({ title: "Lead Deleted", description: "The lead has been removed." });
        } catch (error) {
             toast({ title: "Error Deleting Lead", description: "Could not remove the lead.", variant: "destructive" });
        }
    }
  }, [firestore, toast]);

  const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName' | 'dealershipName'> & { initialNotes?: string }, callback?: (lead: Lead) => void) => {
    if (!firestore || !user || !staffData || !dealershipsData) return;
    const owner = staffData.find(s => s.id === newLeadData.ownerId);
    const dealership = dealershipsData.find(d => d.id === newLeadData.dealershipId);
    
    if (!owner || !dealership) {
         toast({ title: "Error", description: "Could not find lead owner or dealership.", variant: "destructive" });
         return;
    };

    const leadsCollection = collection(firestore, 'leads');
    const { initialNotes, ...leadData } = newLeadData;
    
    const finalLeadData = {
        ...leadData,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        ownerName: owner.name,
        dealershipName: dealership.name,
    };

    try {
        const newDocRef = await addDoc(leadsCollection, finalLeadData);
        
        await addNoteEntry(firestore, user, newDocRef.id, "Lead created.", "System");

        if (initialNotes && initialNotes.trim() !== '') {
            await addNoteEntry(firestore, user, newDocRef.id, initialNotes, 'Manual');
        }
        toast({ title: "Lead Added", description: "New lead created successfully." });
        
        const createdLead: Lead = { id: newDocRef.id, ...finalLeadData, createdAt: new Date() } as Lead;
        if(callback) callback(createdLead);

    } catch (error) {
         console.error("Error creating lead:", error);
         toast({ title: "Error creating lead", description: "Could not save the new lead.", variant: "destructive" });
    }
  }, [firestore, staffData, dealershipsData, user, toast]);

  const handleUpdateOwner = useCallback(async (id: string, oldOwnerName: string, newOwnerId: string, newOwnerName: string) => {
    if (!firestore || !user || !staffData || !leadsSnapshot) return;

    const leadDoc = leadsSnapshot.find(l => l.id === id);
    if (!leadDoc) {
        toast({ title: "Error", description: "Lead not found.", variant: "destructive"});
        return;
    }

    const batch = writeBatch(firestore);
    try {
        const leadRef = doc(firestore, 'leads', id);
        batch.update(leadRef, { ownerId: newOwnerId, ownerName: newOwnerName, lastActivity: serverTimestamp() });

        const appointmentsQuery = query(collection(firestore, 'appointments'), where('leadId', '==', id));
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        appointmentsSnapshot.forEach(appointmentDoc => {
            batch.update(doc(firestore, 'appointments', appointmentDoc.id), { ownerId: newOwnerId });
        });
        await batch.commit();

        const noteContent = `Owner changed from '${oldOwnerName}' to '${newOwnerName}' by ${user.name}`;
        await addNoteEntry(firestore, user, id, noteContent, 'Owner Change');
        
        if (newOwnerId !== user.id) {
            await createNotification(firestore, newOwnerId, leadDoc, `You have been assigned a new lead: ${leadDoc.name}.`, user.name);
        }

        const oldOwner = staffData.find(s => s.name === oldOwnerName);
        if (oldOwner && oldOwner.id !== user.id) {
             await createNotification(firestore, oldOwner.id, leadDoc, `Lead ${leadDoc.name} was reassigned to ${newOwnerName}.`, user.name);
        }
        toast({ title: "Owner Updated", description: `${leadDoc.name} and all their appointments are now assigned to ${newOwnerName}.` });
    } catch (error) {
        console.error("Error updating owner and appointments:", error);
        toast({ title: "Error", description: "Could not update lead owner and associated appointments.", variant: "destructive"});
    }
  }, [firestore, user, staffData, toast, leadsSnapshot]);

  const handleUpdateDealership = useCallback(async (leadId: string, newDealershipId: string) => {
    if (!firestore || !user || !dealershipsData || !leadsSnapshot) return;

    const leadDoc = leadsSnapshot.find(l => l.id === leadId);
    const newDealership = dealershipsData.find(d => d.id === newDealershipId);

    if (!leadDoc || !newDealership) {
        toast({ title: "Error", description: "Lead or dealership not found.", variant: "destructive"});
        return;
    }

    try {
        const leadRef = doc(firestore, 'leads', leadId);
        await updateDoc(leadRef, {
            dealershipId: newDealership.id,
            dealershipName: newDealership.name,
            lastActivity: serverTimestamp()
        });

        const noteContent = `Dealership changed from '${leadDoc.dealershipName}' to '${newDealership.name}' by ${user.name}.`;
        await addNoteEntry(firestore, user, leadId, noteContent, 'Dealership Change');
        
        toast({ title: "Dealership Updated", description: `${leadDoc.name} is now assigned to ${newDealership.name}.` });
    } catch (error) {
        console.error("Error updating dealership:", error);
        toast({ title: "Error", description: "Could not update lead dealership.", variant: "destructive"});
    }
  }, [firestore, user, dealershipsData, leadsSnapshot, toast]);
  
  const handleSendWhatsapp = useCallback((lead: Lead) => {
    setWhatsAppLead(lead);
  }, []);

  /* ------------------------------- table setup -------------------------------- */
  
  const columns = useMemo(
    () => getColumns(handleUpdateStage, handleDelete, handleUpdateOwner, handleUpdateDealership, handleSendWhatsapp, staffData, dealershipsData),
    [handleUpdateStage, handleDelete, handleUpdateOwner, handleUpdateDealership, handleSendWhatsapp, staffData, dealershipsData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination, expanded },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <main className="flex flex-1 flex-col gap-4">
      <DataTable
        table={table}
        columns={columns}
        onAddLead={handleAddLead}
        staff={staffData}
        dealerships={dealershipsData}
        loading={leadsLoading || staffLoading || dealershipsLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
      />
      <SendWhatsappDialog 
        lead={whatsAppLead}
        isOpen={!!whatsAppLead}
        onClose={() => setWhatsAppLead(null)}
      />
    </main>
  );
}

export default function LeadsPage() {
  return <LeadsPageContent />;
}
