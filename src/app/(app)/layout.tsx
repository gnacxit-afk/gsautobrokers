'use client';
import { AppShell } from '@/components/layout/app-shell';

// This layout's primary job is to establish the AppShell
// as the protective boundary for all authenticated routes.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
