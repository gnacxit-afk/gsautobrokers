'use client';
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // AuthProvider is already in the root layout.
  // This layout's primary job is to establish the AppShell for protected routes.
  return (
      <AppShell>
        {children}
      </AppShell>
  );
}
