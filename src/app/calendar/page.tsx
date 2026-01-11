'use client';

export default function CalendarPage() {
  return (
    <main className="flex-1">
       <div className="mb-6">
        <h1 className="text-2xl font-bold">Citas</h1>
        <p className="text-muted-foreground">
          Aquí construiremos nuestro calendario de citas.
        </p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center h-96 flex items-center justify-center">
          <p className="text-muted-foreground">El contenido del calendario irá aquí.</p>
      </div>
    </main>
  );
}
