'use client';

export default function OnboardingPage() {
  return (
    <main className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Onboarding</h1>
      </div>
       <div className="border border-dashed rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Candidates currently in the onboarding process will be displayed here.</p>
      </div>
    </main>
  );
}
