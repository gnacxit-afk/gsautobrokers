
'use client';

import React from 'react';

export default function AppointmentsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Appointments</h1>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Appointments Calendar
          </h3>
          <p className="text-sm text-muted-foreground">
            The calendar will be implemented here.
          </p>
        </div>
      </div>
    </main>
  );
}
