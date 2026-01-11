
'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import type { Appointment } from '@/lib/types';
import { startOfDay } from 'date-fns';

interface AppointmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: Appointment[];
}

export function AppointmentCalendar({ selectedDate, onDateChange, appointments }: AppointmentCalendarProps) {
  const appointmentsByDay = React.useMemo(() => {
    const map = new Map<string, number>();
    appointments.forEach(apt => {
      const day = startOfDay(apt.startTime.toDate()).toISOString();
      map.set(day, (map.get(day) || 0) + 1);
    });
    return map;
  }, [appointments]);

  const modifiers = {
    hasAppointments: (date: Date) => {
      return appointmentsByDay.has(startOfDay(date).toISOString());
    },
  };

  const modifiersStyles = {
    hasAppointments: {
      position: 'relative',
      overflow: 'visible',
    },
  };

  const DayContent = (props: { date: Date }) => {
    const count = appointmentsByDay.get(startOfDay(props.date).toISOString());
    return (
      <div className="relative">
        {props.date.getDate()}
        {count && count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {count}
          </span>
        )}
      </div>
    );
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={(date) => onDateChange(date || new Date())}
      locale={es}
      disabled={{ before: new Date() }}
      modifiers={modifiers}
      modifiersStyles={modifiersStyles}
      components={{
        DayContent: DayContent,
      }}
      className="rounded-md border"
    />
  );
}
