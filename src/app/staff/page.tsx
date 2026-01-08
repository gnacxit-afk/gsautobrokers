
'use client';

import { useMemo, useState, useEffect } from 'react';
import { AccessDenied } from '@/components/access-denied';
import { NewStaffDialog } from './components/new-staff-dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import type { Staff } from '@/lib/types';
import Link from 'next/link';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/lib/auth';

const StaffCard = ({ member, onDelete, isMasterAdmin }: { member: Staff, onDelete: (id: string, name: string) => void, isMasterAdmin: boolean }) => {
  const roleColors = {
    Admin: 'bg-red-50 text-red-600',
    Supervisor: 'bg-blue-50 text-blue-600',
    Broker: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <Users size={24} />
        </div>
        <span
          className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${roleColors[member.role]}`}>
          {member.role}
        </span>
      </div>
      <h4 className="font-bold text-slate-800 text-lg">{member.name}</h4>
      <p className="text-xs text-slate-400 mb-4">ID: {member.id}</p>
      <div className="pt-4 border-t flex justify-between items-center">
        <Link href={`/staff/${member.id}`}>
          <Button variant="link" className="p-0 h-auto text-xs">
            View Profile
          </Button>
        </Link>
        {member.email !== 'gnacxit@gmail.com' && isMasterAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the profile for <span className="font-bold">{member.name}</span> and reassign their leads.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(member.id, member.name)} className="bg-destructive hover:bg-destructive/90">
                  Yes, delete profile
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

const StaffCardSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <Skeleton className="w-16 h-6 rounded-md" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <div className="pt-4 border-t flex justify-between items-center">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};

export default function StaffPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { MASTER_ADMIN_EMAIL } = useAuthContext();
  
  const staffQuery = useMemo(() => firestore ? collection(firestore, 'staff') : null, [firestore]);
  const { data: staff, loading } = useCollection<Staff>(staffQuery);

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

  if (user?.role !== 'Admin') {
    return <AccessDenied />;
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Staff Management</h3>
        <NewStaffDialog>
          <Button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
            <UserPlus size={18} /> Register Employee
          </Button>
        </NewStaffDialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => <StaffCardSkeleton key={i} />)
        ) : (
          (staff || []).map((member) => <StaffCard key={member.id} member={member} onDelete={handleDelete} isMasterAdmin={user?.email === MASTER_ADMIN_EMAIL}/>)
        )}
      </div>
    </main>
  );
}
