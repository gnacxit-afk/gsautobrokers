
// This layout is intentionally simple. It does not include any authentication providers.
// It's used for pages that should be accessible to everyone, like the application form.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
