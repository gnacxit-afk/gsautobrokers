
import { AuthProvider } from "@/lib/auth";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        {children}
      </div>
    </AuthProvider>
  );
}
