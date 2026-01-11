'use client';

export default function CalendarPage() {
  return (
    <main className="flex-1">
       <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          Here we will build our appointment calendar.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Calendar content will go here.</p>
      </div>
    </main>
  );
}
