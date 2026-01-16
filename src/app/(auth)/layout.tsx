// This layout provides a clean slate for authentication pages like login.
// It ensures that the main app shell (sidebars, headers) is not rendered.
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
