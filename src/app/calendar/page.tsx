
'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <main className="flex-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Citas</h1>
        <p className="text-muted-foreground">
          Selecciona una fecha para ver o agendar citas.
        </p>
      </div>
      <div className="flex justify-center pt-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          locale={es}
          defaultMonth={new Date()}
        />
      </div>
    </main>
  );
}
