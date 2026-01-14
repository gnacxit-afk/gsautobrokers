'use client';
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout's primary job is to establish the AppShell
  // as the protective boundary for all authenticated routes.
  return (
      <AppShell>
        {children}
      </AppShell>
  );
}
