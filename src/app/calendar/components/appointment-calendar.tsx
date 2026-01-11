
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  format,
  isSameDay,
  parseISO,
  Timestamp,
} from 'date-fns';
import { User, Clock, CheckCircle2, XCircle } from 'lucide-react';
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

const BrokerColorMap: Record<string, { bg: string, text: string }> = {};
const brokerColors = [
    { bg: 'bg-sky-100', text: 'text-sky-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-rose-100', text: 'text-rose-800' },
    { bg: 'bg-amber-100', text: 'text-amber-800' },
    { bg: 'bg-violet-100', text: 'text-violet-800' },
];

const getBrokerColor = (brokerId: string) => {
    if (!BrokerColorMap[brokerId]) {
        BrokerColorMap[brokerId] = brokerColors[Object.keys(BrokerColorMap).length % brokerColors.length];
    }
    return BrokerColorMap[brokerId];
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

  const appointmentsByDate = useMemo(() => {
    return filteredAppointments.reduce((acc, appointment) => {
        const appointmentDate = appointment.appointment?.date;
        if (!appointmentDate) return acc;
        
        const date = (appointmentDate as any).toDate ? (appointmentDate as any).toDate() : new Date(appointmentDate as string);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(appointment);
        return acc;
    }, {} as Record<string, Lead[]>);
  }, [filteredAppointments]);

  const handleUpdateAppointment = () => {
    // This is a placeholder for Firestore update logic, which now happens
    // inside the AppointmentDialog component itself. This function mainly
    // serves to close the dialog after an update.
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
      <div className="md:grid md:grid-cols-[24rem_1fr] md:divide-x md:divide-gray-200">
        <div className="md:pr-8">
            <div className="flex items-center justify-between mb-4">
                 <h2 className="flex-auto text-lg font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                 {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                    <Select value={brokerFilter} onValueChange={setBrokerFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Broker" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Brokers</SelectItem>
                            {selectableBrokers.map(broker => (
                                <SelectItem key={broker.id} value={broker.id}>{broker.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
             <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(day) => day && setSelectedDay(day)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border p-0"
                modifiers={{
                  hasAppointment: (date) => appointmentsByDate[format(date, 'yyyy-MM-dd')]?.length > 0,
                }}
                modifiersClassNames={{
                  hasAppointment: 'bg-blue-100/50 text-blue-800 rounded-full',
                }}
             />
        </div>
        <section className="mt-12 md:mt-0 md:pl-8">
          <h2 className="font-semibold text-gray-900">
            Agenda for <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>{format(selectedDay, 'MMMM d, yyyy')}</time>
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-gray-500">
            {appointmentsByDate[format(selectedDay, 'yyyy-MM-dd')]?.length > 0 ? (
              appointmentsByDate[format(selectedDay, 'yyyy-MM-dd')].map((appointment) => {
                 const appointmentColor = getBrokerColor(appointment.ownerId);
                 return (
                    <li 
                      key={appointment.id} 
                      className={cn(
                        "group flex items-center space-x-4 rounded-xl p-3 focus-within:bg-gray-100 hover:bg-gray-100 cursor-pointer",
                         appointmentColor.bg
                      )}
                      onClick={() => setEditingAppointment(appointment)}
                    >
                        {appointment.appointment?.time && (
                            <div className="flex-shrink-0 w-20 text-center">
                                <p className="font-bold text-base text-slate-800">{appointment.appointment.time}</p>
                            </div>
                        )}
                        <div className="flex-auto">
                            <p className={cn("font-semibold", appointmentColor.text)}>{appointment.name}</p>
                            <p className="mt-0.5 flex items-center gap-2 text-xs">
                                <User size={14} />
                                {appointment.ownerName}
                            </p>
                        </div>
                        {appointment.appointment?.confirmed ? (
                            <CheckCircle2 size={18} className="text-green-600" title="Confirmed" />
                        ) : (
                           <XCircle size={18} className="text-red-600" title="Not Confirmed" />
                        )}
                    </li>
                 );
              })
            ) : (
              <div className="text-center py-10 text-slate-400">
                <p>No appointments for this day.</p>
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
