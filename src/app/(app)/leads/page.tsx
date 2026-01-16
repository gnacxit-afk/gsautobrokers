
"use client";

import { useState, useMemo, useCallback } from "react";
import { getColumns } from "./components/columns";
import { DataTable } from "@/app/(app)/leads/components/data-table";
import type { Lead, Staff } from "@/lib/types";
import { useDateRange } from "@/hooks/use-date-range";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
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
  type QueryConstraint,
  limit,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { isWithinInterval, isValid } from "date-fns";
import { addNoteEntry, createNotification } from "@/lib/utils";
import { matchSorter } from 'match-sorter';

/* -------------------------------- helpers -------------------------------- */

export function parseSearch(search: string) {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  const keywords: Record<string, string> = {};
  const text: string[] = [];

  for (const term of terms) {
    if (term.includes(":")) {
      const [k, ...v] = term.split(":");
      const value = v.join(":").trim();
      if (value) keywords[k] = value;
    } else {
      text.push(term);
    }
  }
  return { keywords, text };
}

/* ------------------------------- component -------------------------------- */

function LeadsPageContent() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { dateRange } = useDateRange();
  const router = useRouter();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastActivity", desc: true },
  ]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 100 });
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState({});

  /* ------------------------------ staff data ------------------------------ */

  const staffQuery = useMemo(
    () => (firestore ? query(collection(firestore, "staff")) : null),
    [firestore]
  );

  const { data: staffSnapshot, loading: staffLoading } = useCollection<Staff>(staffQuery);
  const staffData = useMemo(() => staffSnapshot || [], [staffSnapshot]);

  /* ----------------------------- FIRESTORE QUERY ---------------------------- */

  const leadsQuery = useMemo(() => {
    if (!firestore || !user || !staffData.length) return null;

    const { keywords } = parseSearch(globalFilter);
    const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(50)];

    // Role-based pre-filter
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

    // Structured keyword filters for Firestore
    if (keywords.stage) {
      constraints.push(where("stage", "==", keywords.stage));
    }
    if (keywords.channel) {
      constraints.push(where("channel", "==", keywords.channel));
    }
    if (keywords.owner) {
      const owner = staffData.find((s) =>
        s.name.toLowerCase().includes(keywords.owner)
      );
      if (owner) {
        constraints.push(where("ownerId", "==", owner.id));
      }
    }

    return query(collection(firestore, "leads"), ...constraints);
  }, [firestore, user, globalFilter, staffData]);

  const { data: leadsSnapshot, loading: leadsLoading } = useCollection<Lead>(leadsQuery);

  /* --------------------------- CLIENT-SIDE FILTER --------------------------- */

  const filteredData = useMemo(() => {
    if (!leadsSnapshot) return [];

    const { text } = parseSearch(globalFilter);

    // 1. Filter by date range first
    const dateFilteredLeads = leadsSnapshot.filter((lead) => {
        if (dateRange?.start && dateRange?.end) {
            const date = (lead.createdAt as any)?.toDate?.() ?? new Date(lead.createdAt as any);
            if (isValid(date) && !isWithinInterval(date, { start: dateRange.start, end: dateRange.end }))
              return false;
        }
        return true;
    });

    // 2. Then apply fuzzy search on the remaining text
    if (text.length === 0) {
        return dateFilteredLeads;
    }
    
    return matchSorter(dateFilteredLeads, text.join(' '), {
        keys: ['name', 'phone', 'email'],
    });

  }, [leadsSnapshot, globalFilter, dateRange]);

  /* -------------------------------- ACTIONS ------------------------------- */

    const handleUpdateStage = useCallback(async (leadId: string, oldStage: Lead['stage'], newStage: Lead['stage']) => {
        if (!firestore || !user) return;
        const leadRef = doc(firestore, 'leads', leadId);
        const lead = leadsSnapshot?.find(l => l.id === leadId);

        if (!lead) return;
        
        const batch = writeBatch(firestore);
        try {
            batch.update(leadRef, { stage: newStage });

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

    const handleAddLead = useCallback(async (newLeadData: Omit<Lead, 'id' | 'createdAt' | 'ownerName'> & { initialNotes?: string }, callback?: (lead: Lead) => void) => {
        if (!firestore || !user || !staffData) return;
        const owner = staffData.find(s => s.id === newLeadData.ownerId);
        if (!owner) {
             toast({ title: "Error", description: "Could not find lead owner.", variant: "destructive" });
             return;
        };

        const leadsCollection = collection(firestore, 'leads');
        const { initialNotes, ...leadData } = newLeadData;
        
        const finalLeadData = {
            ...leadData,
            createdAt: serverTimestamp(),
            lastActivity: serverTimestamp(),
            ownerName: owner.name,
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
    }, [firestore, staffData, user, toast]);

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
            batch.update(leadRef, { ownerId: newOwnerId, ownerName: newOwnerName });
    
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

  /* ------------------------------- table setup -------------------------------- */
  
  const columns = useMemo(
    () => getColumns(handleUpdateStage, handleDelete, handleUpdateOwner, staffData),
    [handleUpdateStage, handleDelete, handleUpdateOwner, staffData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination, expanded, globalFilter },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
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
        loading={leadsLoading || staffLoading}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        clearAllFilters={() => setGlobalFilter("")}
      />
    </main>
  );
}

export default function LeadsPage() {
  return <LeadsPageContent />;
}
