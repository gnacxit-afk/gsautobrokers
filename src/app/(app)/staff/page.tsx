

'use client';

import { useMemo, useState, useCallback } from 'react';
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, getFilteredRowModel, type SortingState } from '@tanstack/react-table';
import { AccessDenied } from '@/components/access-denied';
import { NewStaffDialog } from './components/new-staff-dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, MessageSquare } from 'lucide-react';
import type { Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/lib/auth';
import { SendNotificationDialog } from './components/send-notification-dialog';
import { getColumns } from './components/columns';
import { StaffDataTable } from './components/staff-data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function StaffPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { MASTER_ADMIN_EMAIL } = useAuthContext();
  
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staff, loading } = useCollection<Staff>(staffQuery);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');


  const handleDelete = async (id: string, name: string) => {
    if (!firestore || !staff) return;
    try {
      const masterAdmin = staff.find(s => s.email === MASTER_ADMIN_EMAIL);
      if (!masterAdmin) {
        throw new Error("Master Admin account not found.");
      }

      const leadsRef = collection(firestore, 'leads');
      const q = query(leadsRef, where("ownerId", "==", id));
      const leadsSnapshot = await getDocs(q);

      if (!leadsSnapshot.empty) {
        const batch = writeBatch(firestore);
        leadsSnapshot.forEach(leadDoc => {
          batch.update(leadDoc.ref, {
            ownerId: masterAdmin.id,
            ownerName: masterAdmin.name
          });
        });
        await batch.commit();
      }

      const staffDocRef = doc(firestore, 'staff', id);
      await deleteDoc(staffDocRef);

      toast({
        title: "Profile Deleted",
        description: `The profile for ${name} has been removed and their leads have been reassigned.`,
      });
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete the profile.",
        variant: "destructive"
      });
    }
  };

  const columns = useMemo(() => getColumns({ onDelete: handleDelete, isMasterAdmin: user?.email === MASTER_ADMIN_EMAIL, allStaff: staff || [] }), [user?.email, MASTER_ADMIN_EMAIL, staff, handleDelete]);

  const { myTeam, otherStaff } = useMemo(() => {
    if (!user || !staff) return { myTeam: [], otherStaff: [] };
    const myTeam = staff.filter(s => s.supervisorId === user.id);
    const otherStaff = staff.filter(s => s.supervisorId !== user.id);
    return { myTeam, otherStaff };
  }, [user, staff]);
  
  const tableData = useMemo(() => staff || [], [staff]);
  
  const table = useReactTable({
      data: tableData,
      columns,
      state: {
          sorting,
          globalFilter,
      },
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
  });

  const myTeamTable = useReactTable({
      data: myTeam,
      columns,
      state: { sorting, globalFilter },
      onSortingChange: setSorting,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
  });


  if (user?.role !== 'Admin' && user?.role !== 'Supervisor') {
    return <AccessDenied />;
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Staff Management</h3>
        <div className="flex items-center gap-2">
           <SendNotificationDialog allStaff={staff || []}>
             <Button variant="outline" className="text-indigo-600 border-indigo-200 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700">
              <MessageSquare size={18} /> Send Notification
            </Button>
          </SendNotificationDialog>
          {user.role === 'Admin' && (
            <NewStaffDialog>
              <Button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                <UserPlus size={18} /> Register Employee
              </Button>
            </NewStaffDialog>
          )}
        </div>
      </div>
      
      {user.role === 'Admin' ? (
          <StaffDataTable 
            table={table}
            columns={columns}
            loading={loading}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            allStaff={staff || []}
          />
      ) : (
          <Tabs defaultValue="my-team">
              <TabsList>
                  <TabsTrigger value="my-team">My Team</TabsTrigger>
              </TabsList>
              <TabsContent value="my-team">
                  <StaffDataTable 
                    table={myTeamTable}
                    columns={columns}
                    loading={loading}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    allStaff={staff || []}
                  />
              </TabsContent>
          </Tabs>
      )}

    </main>
  );
}

    
