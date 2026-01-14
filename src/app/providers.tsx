
"use client";

import { FirebaseProvider } from "@/firebase/provider";
import { AuthProvider } from "@/lib/auth";
import { DateRangeProvider } from "@/providers/date-range-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <DateRangeProvider>
          {children}
        </DateRangeProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
}
