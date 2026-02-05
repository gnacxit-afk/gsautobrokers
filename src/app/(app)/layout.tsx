'use client';

import React from "react";
import { DateRangeProvider } from "@/providers/date-range-provider";
import { AppShell } from "@/components/layout/app-shell";

// This layout wraps the authenticated part of the application with providers
// that are specific to the app shell, like the date range.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DateRangeProvider>
        <AppShell>{children}</AppShell>
    </DateRangeProvider>
  );
}
