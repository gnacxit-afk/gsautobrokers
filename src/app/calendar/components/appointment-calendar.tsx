
"use client";

import React, { useState, useMemo } from 'react';
import { format, isSameDay, startOfMonth } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

export function AppointmentCalendar({ appointments, loading }: { appointments: Lead[], loading: boolean }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

  const appointmentsByDay = useMemo(() => {
    const grouped: { [key: string]: Lead[] } = {};
    appointments.forEach(appt => {
      if (!appt.appointmentDate) return;
      const date = (appt.appointmentDate as any).toDate ? (appt.appointmentDate as any).toDate() : new Date(appt.appointmentDate as string);
      const dayKey = format(date, 'yyyy-MM-dd');
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(appt);
    });
    return grouped;
  }, [appointments]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dayKey = format(selectedDate, 'yyyy-MM-dd');
    return appointmentsByDay[dayKey] || [];
  }, [selectedDate, appointmentsByDay]);
  
  const appointmentDays = Object.keys(appointmentsByDay).map(dayKey => new Date(dayKey + 'T00:00:00'));

  const renderDate = (date: any): Date => {
      if (!date) return new Date();
      if (date.toDate) return date.toDate();
      return new Date(date);
  }

  if (loading) {
      return (
          <div className="flex h-full gap-8">
              <div className="w-2/3">
                  <Skeleton className="h-full w-full" />
              </div>
              <div className="w-1/3">
                  <Skeleton className="h-full w-full" />
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col md:flex-row h-full gap-8">
      <Card className="flex-1 md:w-2/3 shadow-sm">
        <CardContent className="p-2 md:p-6 h-full">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={month}
                onMonthChange={setMonth}
                className="w-full h-full"
                classNames={{
                    root: "h-full flex flex-col",
                    months: "flex-1",
                    month: "h-full flex flex-col",
                    table: "h-full",
                    caption_label: "text-xl font-bold",
                    day: "h-full w-full text-base",
                    head_cell: "text-muted-foreground text-sm font-normal",
                }}
                modifiers={{
                    hasAppointment: appointmentDays,
                }}
                modifiersClassNames={{
                    hasAppointment: "has-appointment",
                }}
                components={{
                    DayContent: ({ date }) => {
                        const dayKey = format(date, 'yyyy-MM-dd');
                        const hasAppointment = !!appointmentsByDay[dayKey];
                        return (
                            <div className="relative h-full w-full flex items-center justify-center">
                               <span>{date.getDate()}</span>
                               {hasAppointment && (
                                   <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-primary"></div>
                               )}
                            </div>
                        );
                    }
                }}
            />
        </CardContent>
      </Card>
      <div className="w-full md:w-1/3 flex flex-col">
        <Card className="flex-1 shadow-sm">
          <CardHeader>
            <CardTitle>
                Appointments for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)] pr-4">
              {selectedDayAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {selectedDayAppointments.map(appt => (
                    <li key={appt.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <Link href={`/leads/${appt.id}/notes`}>
                        <p className="font-bold text-primary hover:underline">{appt.name}</p>
                      </Link>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <User size={14} />
                        Assigned to: {appt.ownerName}
                      </p>
                       <p className="text-xs text-slate-400 mt-1">
                          Created: {format(renderDate(appt.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-400 py-10">
                    <p>No appointments for this day.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <style>{`
        .has-appointment button {
            font-weight: bold;
        }
      `}</style>
    </div>
  );
}
