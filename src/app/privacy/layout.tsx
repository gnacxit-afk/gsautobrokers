
'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons';

// This layout provides a public-facing header and footer for the privacy policy page.
export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <div className="bg-background-light dark:bg-background-dark text-[#111418] dark:text-white antialiased">
        <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#f0f2f4] dark:border-gray-800">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
                <Logo />
                <nav className="hidden md:flex items-center gap-10">
                    <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="/">Home</Link>
                    <Link className="text-[#111418] dark:text-gray-300 text-sm font-semibold hover:text-primary transition-colors" href="/inventory">Inventory</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <Link href="/login" className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm">
                        Broker Access
                    </Link>
                </div>
            </div>
        </header>
        <main>
            {children}
        </main>
        <footer className="bg-white dark:bg-background-dark border-t border-[#f0f2f4] dark:border-gray-800 py-12">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© 2026 GS Autobrokers LLC. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link className="text-primary dark:text-primary text-sm font-bold" href="/privacy">Privacy Policy</Link>
                        <Link className="hover:underline" href="/terms">Terms of Service</Link>
                        <Link className="hover:underline" href="/cookie-policy">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    </div>
  );
}
