"use client";

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/lib/auth";

// These are the top-level providers that wrap the entire application.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
