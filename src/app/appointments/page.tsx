
'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Appointment, Lead, Staff } from '@/lib/types';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, orderBy, type Query, type DocumentData, type QueryConstraint, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, addMinutes, startOfHour, getDay, isSameDay, set, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AppointmentDialog } from '@/components/dialogs/appointment-dialog';
import Link from 'next/link';


const TimeSlot = ({ time, appointments, onSlotClick, leadsMap }: { time: Date; appointments: (Appointment & { overlapCount: number; overlapIndex: number; })[]; onSlotClick: (time: Date) => void; leadsMap: Map<string, Lead> }) => {

    return (
        <div className="relative h-20 border-t border-b border-gray-200 -mt-px" onClick={() => onSlotClick(time)}>
            <time className="absolute -left-14 top-0 text-xs text-muted-foreground w-12 text-right">
                {format(time, 'p', { locale: es })}
            </time>
            <div className="relative h-full">
                {appointments.map(apt => {
                    const lead = leadsMap.get(apt.leadId);
                    const stage = lead?.stage;

                    const itemClasses = cn("absolute p-2 border-l-4 rounded-r-lg cursor-pointer overflow-hidden text-left", {
                        'bg-green-50 hover:bg-green-100 border-green-400': stage === 'Ganado',
                        'bg-red-50 hover:bg-red-100 border-red-400': stage === 'Perdido',
                        'bg-amber-50 hover:bg-amber-100 border-amber-400': stage === 'Citado' || stage === 'En Seguimiento',
                        'bg-slate-50 hover:bg-blue-50 border-slate-300 hover:border-blue-400': !stage || (stage !== 'Ganado' && stage !== 'Perdido' && stage !== 'Citado' && stage !== 'En Seguimiento'),
                    });
                    
                    const appointmentDuration = 30; // minutes
                    const height = (appointmentDuration / 60) * 100;

                    // Logic for overlapping appointments
                    const width = 100 / apt.overlapCount;
                    const left = apt.overlapIndex * width;

                    return (
                        <Link href={`/leads/${apt.leadId}/notes`} key={apt.id}>
                           <div
                                className={itemClasses}
                                style={{
                                    height: `${height}%`,
                                    top: `${(apt.startTime.toDate().getMinutes() / 60) * 100}%`,
                                    width: `${width}%`,
                                    left: `${left}%`
                                }}
                            >
                                <p className="font-bold text-xs line-clamp-1">{apt.leadName}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{leadsMap.get(apt.leadId)?.ownerName || 'Unknown'}</p>
                           </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

function groupAppointmentsByTime(appointments: Appointment[]) {
  const grouped: Record<string, Appointment[]> = {};
  appointments.forEach(apt => {
    const startTimeStr = format(apt.startTime.toDate(), 'yyyy-MM-dd HH:mm');
    if (!grouped[startTimeStr]) {
      grouped[startTimeStr] = [];
    }
    grouped[startTimeStr].push(apt);
  });
  return Object.values(grouped);
}

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const firestore = useFirestore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterOwnerId, setFilterOwnerId] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTime, setDialogTime] = useState<Date>(new Date());
  
  const staffQuery = useMemo(() => {
    if (!firestore) return null;
    return collection(firestore, 'staff');
  }, [firestore]);
  const { data: allStaff, loading: staffLoading } = useCollection<Staff>(staffQuery);

  const appointmentsQuery = useMemo(() => {
    if (!firestore || !user) return null;

    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    let constraints: QueryConstraint[] = [
        orderBy('startTime'),
        where('startTime', '>=', start),
        where('startTime', '<=', end),
    ];
    
    if (filterOwnerId !== 'all') {
        constraints.push(where('ownerId', '==', filterOwnerId));
    } else if (user.role === 'Broker') {
        constraints.push(where('ownerId', '==', user.id));
    } else if (user.role === 'Supervisor' && allStaff) {
        const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
        const visibleIds = [user.id, ...teamIds];
        if (visibleIds.length > 0) {
            constraints.push(where('ownerId', 'in', visibleIds));
        } else {
             constraints.push(where('ownerId', '==', user.id));
        }
    }

    return query(collection(firestore, 'appointments'), ...constraints);
  }, [firestore, user, allStaff, selectedDate, filterOwnerId]);

  const leadsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'leads'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: appointments, loading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery as Query<DocumentData> | null);
  const { data: leads, loading: leadsLoading } = useCollection<Lead>(leadsQuery);
  
  const leadsMap = useMemo(() => {
    if (!leads) return new Map();
    return new Map(leads.map(l => [l.id, l]));
  }, [leads]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 8; i < 18; i++) { // 8 AM to 5 PM
        slots.push(set(selectedDate, { hours: i, minutes: 0, seconds: 0, milliseconds: 0 }));
    }
    return slots;
  }, [selectedDate]);

  const groupedAppointments = useMemo(() => {
      const appointmentsWithOverlap = (appointments || []).map((apt, i, arr) => {
          const overlaps = arr.filter(otherApt =>
              apt.startTime.seconds < otherApt.endTime.seconds &&
              apt.endTime.seconds > otherApt.startTime.seconds
          );
          const overlapIndex = overlaps.findIndex(o => o.id === apt.id);
          return { ...apt, overlapCount: overlaps.length, overlapIndex: overlapIndex >= 0 ? overlapIndex : 0 };
      });
      
      const byHour: Record<number, (Appointment & { overlapCount: number; overlapIndex: number; })[]> = {};
      appointmentsWithOverlap.forEach(apt => {
        const hour = apt.startTime.toDate().getHours();
        if (!byHour[hour]) byHour[hour] = [];
        byHour[hour].push(apt);
      });
      return byHour;
  }, [appointments]);

  const handleSlotClick = (time: Date) => {
      setDialogTime(time);
      setIsDialogOpen(true);
  };

  const loading = appointmentsLoading || staffLoading || leadsLoading;
  const selectableStaff = allStaff?.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin') || [];

  return (
    <>
    <main className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Appointments</h1>
             <Button onClick={() => handleSlotClick(new Date())} className="bg-primary hover:bg-primary/90">
                <Plus size={16} className="mr-2"/> New Appointment
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-1">
                <Card className="shadow-sm">
                    <CardContent className="p-2">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="w-full"
                            locale={es}
                        />
                         {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                            <div className="p-4 border-t">
                                <Label htmlFor="owner-filter">Filter by Owner</Label>
                                <Select onValueChange={setFilterOwnerId} value={filterOwnerId}>
                                <SelectTrigger id="owner-filter">
                                    <SelectValue placeholder="Filter by Owner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    {selectableStaff.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            </div>
                         )}
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-3">
                 <Card className="shadow-sm">
                     <CardHeader>
                        <CardTitle>{format(selectedDate, "eeee, d 'de' MMMM", { locale: es })}</CardTitle>
                    </CardHeader>
                     <CardContent className="pr-14">
                        {loading ? (
                             <div className="space-y-4">
                                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                             </div>
                        ) : (
                            <div className="space-y-0">
                                {timeSlots.map(time => (
                                    <TimeSlot
                                        key={time.toString()}
                                        time={time}
                                        appointments={groupedAppointments[time.getHours()] || []}
                                        onSlotClick={handleSlotClick}
                                        leadsMap={leadsMap}
                                    />
                                ))}
                            </div>
                        )}
                         {appointments?.length === 0 && !loading && (
                            <p className="text-muted-foreground text-center p-8">
                                No appointments scheduled for this day.
                            </p>
                         )}
                     </CardContent>
                 </Card>
            </div>
        </div>
    </main>
    <AppointmentDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={dialogTime}
        leads={leads || []}
    />
    </>
  );
}
