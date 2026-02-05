
'use client';

import React from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/lib/auth";
import { DateRangeProvider } from "@/providers/date-range-provider";
import { AppShell } from "@/components/layout/app-shell";

// This layout wraps the entire authenticated part of the application with necessary providers.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        <DateRangeProvider>
            <AppShell>{children}</AppShell>
        </DateRangeProvider>
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
