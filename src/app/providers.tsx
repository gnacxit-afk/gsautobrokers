"use client";

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/lib/auth";
import { DateRangeProvider } from "@/providers/date-range-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthProvider>
        <DateRangeProvider>
            {children}
        </DateRangeProvider>
      </AuthProvider>
    </FirebaseClientProvider>
  );
}
