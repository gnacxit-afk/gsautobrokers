"use client";

import { FirebaseProvider } from "@/firebase/provider";
import { AuthProvider } from "@/lib/auth";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoutes = ["/login", "/apply"];
  const isPublicPage = publicRoutes.some(path => pathname.startsWith(path));

  if (isPublicPage) {
    return (
        <FirebaseProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseProvider>
    )
  }

  return (
    <FirebaseProvider>
      <AuthProvider>
          {children}
      </AuthProvider>
    </FirebaseProvider>
  );
}
