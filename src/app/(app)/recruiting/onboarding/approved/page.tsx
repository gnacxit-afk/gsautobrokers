'use client';

export default function ApprovedForOnboardingPage() {
  return (
    <main className="flex-1 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Approved for Onboarding</h1>
      </div>
       <div className="border border-dashed rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Candidates approved for onboarding will be displayed here.</p>
      </div>
    </main>
  );
}
