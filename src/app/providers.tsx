"use client";

import { FirebaseClientProvider } from "@/firebase/client-provider";
import { DateRangeProvider } from "@/providers/date-range-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <DateRangeProvider>
          {children}
      </DateRangeProvider>
    </FirebaseClientProvider>
  );
}
