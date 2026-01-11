
'use client';

import { useState, useMemo } from 'react';
import { addMinutes, format, getHours, getMinutes, set } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment, Lead } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentDialog } from './appointment-dialog';
import { cn } from '@/lib/utils';
import { Calendar, User, Clock } from 'lucide-react';

interface TimeSlotsProps {
  selectedDate: Date;
  appointments: Appointment[];
  leads: Lead[];
  loading: boolean;
}

const generateTimeSlots = (date: Date, interval: number): Date[] => {
  const slots: Date[] = [];
  let currentTime = set(date, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }); // Start at 9:00 AM
  const endTime = set(date, { hours: 17, minutes: 0, seconds: 0, milliseconds: 0 }); // End at 5:00 PM

  while (currentTime < endTime) {
    slots.push(currentTime);
    currentTime = addMinutes(currentTime, interval);
  }
  return slots;
};

export function TimeSlots({ selectedDate, appointments, leads, loading }: TimeSlotsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const slots = useMemo(() => generateTimeSlots(selectedDate, 30), [selectedDate]);

  const bookedSlots = useMemo(() => {
    return new Set(
      appointments.map(apt => apt.startTime.toDate().getTime())
    );
  }, [appointments]);

  const handleSlotClick = (slot: Date) => {
    setSelectedSlot(slot);
    setDialogOpen(true);
  };
  
  const getAppointmentForSlot = (slot: Date) => {
    return appointments.find(apt => apt.startTime.toDate().getTime() === slot.getTime());
  };


  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(16)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-slate-800">
        {format(selectedDate, 'eeee, d \'de\' MMMM', { locale: es })}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {slots.map((slot, index) => {
          const isBooked = bookedSlots.has(slot.getTime());
          const appointment = isBooked ? getAppointmentForSlot(slot) : null;
          
          if(isBooked && appointment) {
            return (
              <div key={index} className={cn("p-3 rounded-lg text-left text-xs border", {
                "bg-red-50 border-red-200 text-red-800": appointment.status === 'Hot',
                "bg-amber-50 border-amber-200 text-amber-800": appointment.status === 'Warm',
                "bg-blue-50 border-blue-200 text-blue-800": appointment.status === 'Cold',
                "bg-slate-50 border-slate-200 text-slate-800": appointment.status === 'Unknown',
              })}>
                <div className="font-bold flex items-center gap-2"><Clock size={12}/>{format(slot, 'p', { locale: es })}</div>
                <div className="mt-1 flex items-center gap-2"><User size={12}/>{appointment.leadName}</div>
              </div>
            );
          }

          return (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleSlotClick(slot)}
              disabled={isBooked}
            >
              {format(slot, 'p', { locale: es })}
            </Button>
          )
        })}
      </div>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedSlot={selectedSlot}
        leads={leads}
      />
    </div>
  );
}
