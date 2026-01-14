'use client';

export default function FiveMinuteFilterPage() {
  return (
    <main className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">5-Minute Filter</h1>
      </div>
       <div className="border border-dashed rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Candidates in the 5-minute filter stage will be displayed here.</p>
      </div>
    </main>
  );
}
