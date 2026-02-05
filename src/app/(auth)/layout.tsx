'use client';

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/lib/auth";

// This layout provides a clean slate for authentication pages like login.
// It ensures that the main app shell (sidebars, headers) is not rendered.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
          {children}
        </div>
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
