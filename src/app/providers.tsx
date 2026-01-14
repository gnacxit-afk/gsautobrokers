"use client";

import { FirebaseProvider } from "@/firebase/provider";
import { DateRangeProvider } from "@/providers/date-range-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <DateRangeProvider>
          {children}
      </DateRangeProvider>
    </FirebaseProvider>
  );
}
