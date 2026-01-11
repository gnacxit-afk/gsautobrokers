
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  add,
  isSameDay,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock } from 'lucide-react';
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

const colStartClasses = ['', 'col-start-2', 'col-start-3', 'col-start-4', 'col-start-5', 'col-start-6', 'col-start-7'];

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


export function AppointmentCalendar({ appointments, allStaff }: { appointments: Lead[], allStaff: Staff[] }) {
  const { user } = useAuthContext();
  const [today, setToday] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));
  const [editingAppointment, setEditingAppointment] = useState<Lead | null>(null);
  const [brokerFilter, setBrokerFilter] = useState('all');

  const firstDayCurrentMonth = useMemo(() => {
    return parseISO(`${currentMonth.slice(4)}-${format(new Date(currentMonth), 'MM')}-01`);
  }, [currentMonth]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(firstDayCurrentMonth),
      end: endOfMonth(firstDayCurrentMonth),
    });
  }, [firstDayCurrentMonth]);
  
  const filteredAppointments = useMemo(() => {
    if (brokerFilter === 'all') {
        return appointments;
    }
    return appointments.filter(app => app.ownerId === brokerFilter);
  }, [appointments, brokerFilter]);

  const appointmentsByDate = useMemo(() => {
    return filteredAppointments.reduce((acc, appointment) => {
        if (!appointment.appointmentDate) return acc;
        const date = (appointment.appointmentDate as any).toDate ? (appointment.appointmentDate as any).toDate() : new Date(appointment.appointmentDate as string);
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(appointment);
        return acc;
    }, {} as Record<string, Lead[]>);
  }, [filteredAppointments]);

  const nextMonth = () => {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  };

  const previousMonth = () => {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  };

  const handleUpdateAppointment = (lead: Lead, date: Date | null) => {
    // This is a placeholder for the actual Firestore update logic
    // which should be handled in the parent page component.
    console.log(`Update lead ${lead.id} to date ${date}`);
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
      <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
        <div className="md:pr-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="flex-auto text-lg font-semibold text-gray-900">{format(firstDayCurrentMonth, 'MMMM yyyy')}</h2>
                    <Button onClick={previousMonth} variant="ghost" size="icon"><ChevronLeft className="w-5 h-5" aria-hidden="true" /></Button>
                    <Button onClick={nextMonth} variant="ghost" size="icon"><ChevronRight className="w-5 h-5" aria-hidden="true" /></Button>
                </div>
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
          <div className="mt-6 grid grid-cols-7 text-xs leading-6 text-center text-gray-500">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="mt-2 grid grid-cols-7 text-sm">
            {days.map((day, dayIdx) => {
              const dayAppointments = appointmentsByDate[format(day, 'yyyy-MM-dd')] || [];
              return (
                <div
                  key={day.toString()}
                  className={cn(dayIdx === 0 && colStartClasses[getDay(day)], 'py-2 border border-transparent')}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      isSameDay(day, selectedDay) && 'text-white',
                      !isSameDay(day, selectedDay) && isToday(day) && 'text-red-500',
                      !isSameDay(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'text-gray-900',
                      !isSameDay(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && 'text-gray-400',
                      isSameDay(day, selectedDay) && isToday(day) && 'bg-red-500',
                      isSameDay(day, selectedDay) && !isToday(day) && 'bg-gray-900',
                      !isSameDay(day, selectedDay) && 'hover:bg-gray-200',
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full font-semibold transition-colors'
                    )}
                  >
                    <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
                  </button>
                  <div className="w-full h-1 mt-1">
                      {dayAppointments.length > 0 && (
                          <div className="flex justify-center items-center gap-1">
                              {dayAppointments.slice(0, 3).map(app => (
                                  <div key={app.id} className={cn("w-1.5 h-1.5 rounded-full", getBrokerColor(app.ownerId).bg.replace('bg-', ''))}></div>
                              ))}
                          </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <section className="mt-12 md:mt-0 md:pl-8">
          <h2 className="font-semibold text-gray-900">
            Appointments for <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>{format(selectedDay, 'MMMM d, yyyy')}</time>
          </h2>
          <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
            {appointmentsByDate[format(selectedDay, 'yyyy-MM-dd')]?.length > 0 ? (
              appointmentsByDate[format(selectedDay, 'yyyy-MM-dd')].map((appointment) => (
                <li key={appointment.id} className="group flex items-center space-x-4 rounded-xl py-2 px-4 focus-within:bg-gray-100 hover:bg-gray-100">
                  <div className="flex-auto">
                    <p className="text-gray-900 font-semibold">{appointment.name}</p>
                    <p className="mt-0.5 flex items-center gap-2">
                        <User size={14} />
                        {appointment.ownerName}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setEditingAppointment(appointment)}>Edit</Button>
                </li>
              ))
            ) : (
              <p>No appointments for today.</p>
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
