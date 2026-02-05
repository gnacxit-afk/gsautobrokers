'use client';

// The core providers (Firebase, Auth) are now in the root layout's `providers.tsx`.
// This layout just provides the centered styling for auth pages.
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      {children}
    </div>
  );
}
