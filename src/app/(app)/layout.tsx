'use client';
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <AppShell>
        {children}
      </AppShell>
  );
}
