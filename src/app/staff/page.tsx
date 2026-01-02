'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { AccessDenied } from '@/components/access-denied';
import { NewStaffDialog } from './components/new-staff-dialog';
import { Button } from '@/components/ui/button';
import { UserPlus, Users } from 'lucide-react';
import type { Staff } from '@/lib/types';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const StaffCard = ({ member }: { member: Staff }) => {
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
      <p className="text-xs text-slate-400 mb-4">DUI: {member.dui}</p>
      <div className="pt-4 border-t flex justify-between items-center">
        <span className="text-xs text-slate-500">ID: {member.id}</span>
        <Link href={`/staff/${member.id}`}>
          <Button variant="link" className="p-0 h-auto text-xs">
            View Profile
          </Button>
        </Link>
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
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
};

export default function StaffPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const staffQuery = useMemo(
    () => (firestore ? collection(firestore, 'staff') : null),
    [firestore]
  );
  const { data: staffData, loading } = useCollection(staffQuery);

  const staff = (staffData as Staff[]) || [];

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
          staff.map((member) => <StaffCard key={member.id} member={member} />)
        )}
      </div>
    </main>
  );
}
