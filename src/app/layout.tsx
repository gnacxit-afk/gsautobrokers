import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/lib/auth";
import { Suspense } from "react";
import { DateRangeProvider } from "@/providers/date-range-provider";


const manrope = Manrope({ subsets: ["latin"], weight: ['400', '500', '700', '800'], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GS AUTOBROKERS",
  description: "The future of auto sales is here.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      </head>
      <body
        className={cn(
          "min-h-screen bg-gray-50 font-body antialiased",
          manrope.variable
        )}
      >
        <Suspense>
          <FirebaseClientProvider>
            <AuthProvider>
              <DateRangeProvider>
                {children}
              </DateRangeProvider>
            </AuthProvider>
          </FirebaseClientProvider>
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}
