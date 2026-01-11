

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  isToday,
  isValid,
} from 'date-fns';
import { User, CheckCircle2, XCircle, Calendar as CalendarIcon, Briefcase, FilePen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lead, Staff } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AppointmentDialog } from './appointment-dialog';
import { useAuthContext } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const BrokerColorMap: Record<string, { bg: string, text: string, border: string }> = {};
const brokerColors = [
    { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200' },
];

const getBrokerColor = (brokerId: string) => {
    if (!BrokerColorMap[brokerId]) {
        BrokerColorMap[brokerId] = brokerColors[Object.keys(BrokerColorMap).length % brokerColors.length];
    }
    return BrokerColorMap[brokerId];
}

const AppointmentCard = ({ appointment, onEdit }: { appointment: Lead, onEdit: (lead: Lead) => void }) => {
    const router = useRouter();
    const brokerColor = getBrokerColor(appointment.ownerId);

    const statusClasses = appointment.appointment?.confirmed
        ? 'bg-green-100 text-green-800'
        : 'bg-amber-100 text-amber-800';

    return (
        <Card className={cn("shadow-sm transition-all hover:shadow-md border-l-4", brokerColor.border)}>
            <CardContent className="p-4 flex items-center gap-4">
                 <div className="flex-shrink-0 w-24 text-center">
                    {appointment.appointment?.time ? (
                        <div className="text-lg font-bold text-slate-800 bg-slate-100 rounded-lg px-2 py-1">{appointment.appointment.time}</div>
                    ): (
                        <div className="text-xs text-slate-400">No time set</div>
                    )}
                 </div>
                 <div className="flex-1">
                    <p className="font-bold text-slate-900 text-base">{appointment.name}</p>
                     <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <User size={14} />
                        {appointment.ownerName}
                    </p>
                 </div>
                 <div className="flex flex-col items-center gap-2">
                     <div className={cn("px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1.5", statusClasses)}>
                        {appointment.appointment?.confirmed ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                        {appointment.appointment?.confirmed ? 'Confirmed' : 'Not Confirmed'}
                     </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7" onClick={() => router.push(`/leads/${appointment.id}/notes`)}>
                           <Briefcase size={14} className="mr-1"/> Lead
                        </Button>
                         <Button variant="secondary" size="sm" className="h-7" onClick={() => onEdit(appointment)}>
                           <FilePen size={14} className="mr-1"/> Edit
                        </Button>
                    </div>
                 </div>
            </CardContent>
        </Card>
    )
}

export function AppointmentCalendar({ appointments, allStaff, leadToOpen }: { appointments: Lead[], allStaff: Staff[], leadToOpen: Lead | null }) {
  const { user } = useAuthContext();
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingAppointment, setEditingAppointment] = useState<Lead | null>(null);
  const [brokerFilter, setBrokerFilter] = useState('all');

  useEffect(() => {
    if (leadToOpen) {
      const appointmentDate = leadToOpen.appointment?.date;
      if (appointmentDate) {
        const date = (appointmentDate as any).toDate ? (appointmentDate as any).toDate() : new Date(appointmentDate as string);
        setSelectedDay(date);
        setCurrentMonth(date);
      }
      setEditingAppointment(leadToOpen);
    }
  }, [leadToOpen]);
  
  const filteredAppointments = useMemo(() => {
    if (brokerFilter === 'all') {
        return appointments;
    }
    return appointments.filter(app => app.ownerId === brokerFilter);
  }, [appointments, brokerFilter]);

  const { appointmentsByDate, monthStats } = useMemo(() => {
    const byDate: Record<string, Lead[]> = {};
    let monthCount = 0;
    let todayCount = 0;
    let todayUnconfirmed = 0;
    const monthStart = startOfMonth(currentMonth);

    filteredAppointments.forEach((appointment) => {
        const appointmentDate = appointment.appointment?.date;
        if (!appointmentDate) return;
        
        const date = (appointmentDate as any).toDate ? (appointmentDate as any).toDate() : new Date(appointmentDate as string);
        if (!isValid(date)) return;
        
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(appointment);
        byDate[dateKey].sort((a, b) => (a.appointment?.time || '').localeCompare(b.appointment?.time || ''));
        
        if (isSameMonth(date, monthStart)) monthCount++;
        if (isSameDay(date, new Date())) {
            todayCount++;
            if (!appointment.appointment?.confirmed) todayUnconfirmed++;
        }
    });

    return {
        appointmentsByDate: byDate,
        monthStats: { monthCount, todayCount, todayUnconfirmed }
    };
  }, [filteredAppointments, currentMonth]);

  const handleUpdateAppointment = () => {
    setEditingAppointment(null);
  };
  
  const selectableBrokers = useMemo(() => {
     if (user?.role === 'Admin') {
         return allStaff.filter(s => s.role === 'Broker' || s.role === 'Supervisor' || s.role === 'Admin');
     }
      if (user?.role === 'Supervisor') {
          const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
          return allStaff.filter(s => teamIds.includes(s.id) || s.id === user.id);
      }
      if (user?.role === 'Broker') {
          return allStaff.filter(s => s.id === user.id);
      }
      return [];
  }, [allStaff, user]);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Appointment Agenda</h1>
          <p className="text-muted-foreground">
            Agenda for <time dateTime={format(selectedDay, 'yyyy-MM-dd')} className="font-semibold text-primary">{format(selectedDay, 'MMMM d, yyyy')}</time>
          </p>
        </div>
         {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
            <div className="w-full md:w-auto">
                <Select value={brokerFilter} onValueChange={setBrokerFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by Broker" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Brokers</SelectItem>
                        {selectableBrokers.map(broker => (
                            <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground mt-1">Filtering by: <span className="font-semibold">{brokerFilter === 'all' ? 'All Brokers' : selectableBrokers.find(b=>b.id === brokerFilter)?.name}</span></p>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}> <ChevronLeft size={16}/> </Button>
                     <h3 className="flex-auto text-center text-sm font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}> <ChevronRight size={16}/> </Button>
                </CardHeader>
                <CardContent className="p-2">
                    <Calendar
                        mode="single"
                        selected={selectedDay}
                        onSelect={(day) => day && setSelectedDay(day)}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="p-0"
                        modifiers={{
                            hasAppointment: (date) => {
                                if (!isValid(date)) return false;
                                return appointmentsByDate[format(date, 'yyyy-MM-dd')]?.length > 0;
                            }
                        }}
                        modifiersClassNames={{
                            hasAppointment: 'relative',
                        }}
                        components={{
                            Day: (props) => {
                                if (!props.date || !isValid(props.date)) return <div className={cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal invisible")} />;
                                const hasAppointment = appointmentsByDate[format(props.date, 'yyyy-MM-dd')]?.length > 0;
                                const isSelected = isSameDay(props.date, selectedDay);

                                return (
                                    <div className="relative h-full w-full">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedDay(props.date)}
                                            className={cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "h-9 w-9 p-0 font-normal",
                                                {
                                                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground": isSelected,
                                                    "text-muted-foreground opacity-50": props.outside,
                                                    "bg-accent text-accent-foreground": isToday(props.date) && !isSelected,
                                                }
                                            )}
                                        >
                                            {format(props.date, 'd')}
                                        </button>
                                        {hasAppointment && <span className={cn("absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-blue-500")}></span>}
                                    </div>
                                )
                            }
                        }}
                    />
                </CardContent>
                <CardContent className="p-4 border-t">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Quick Summary</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Appointments this month:</span> <span className="font-bold">{monthStats.monthCount}</span></div>
                        <div className="flex justify-between"><span>Appointments today:</span> <span className="font-bold">{monthStats.todayCount}</span></div>
                        <div className="flex justify-between"><span>Unconfirmed today:</span> <span className="font-bold text-amber-600">{monthStats.todayUnconfirmed}</span></div>
                    </div>
                </CardContent>
             </Card>
        </div>
        <section className="lg:col-span-2">
          <ol className="space-y-4">
            {appointmentsByDate[format(selectedDay, 'yyyy-MM-dd')]?.length > 0 ? (
              appointmentsByDate[format(selectedDay, 'yyyy-MM-dd')].map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} onEdit={setEditingAppointment} />
              ))
            ) : (
              <div className="text-center py-20 text-slate-400 border-2 border-dashed rounded-2xl h-full flex flex-col items-center justify-center">
                 <CalendarIcon size={48} strokeWidth={1} className="mb-4 text-slate-300" />
                <h3 className="font-semibold text-slate-600">No appointments for this day</h3>
                <p className="text-sm max-w-xs mt-1">Take this time to confirm future appointments or schedule new leads.</p>
              </div>
            )}
          </ol>
        </section>
      </div>
      {editingAppointment && (
        <AppointmentDialog
            lead={editingAppointment}
            open={!!editingAppointment}
            onOpenChange={() => setEditingAppointment(null)}
            onDateSet={handleUpdateAppointment}
        />
      )}
    </>
  );
}
