import { LeadsPageProvider } from "@/providers/leads-page-provider";
import React from "react";

export default function LeadsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <LeadsPageProvider>{children}</LeadsPageProvider>
}
