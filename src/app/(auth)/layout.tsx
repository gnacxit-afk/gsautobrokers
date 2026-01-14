import { AuthProvider } from "@/lib/auth";

// This layout is now simplified because the AppShell handles showing the login page.
// We keep AuthProvider here to ensure authentication context is available if needed,
// but the visual structure is handled by AppShell.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
