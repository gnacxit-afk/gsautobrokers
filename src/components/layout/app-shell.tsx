
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  PanelLeft,
  PhoneCall,
  UserCircle2,
  TrendingUp,
  CheckSquare,
  Calendar,
} from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/auth";
import type { NavItem as NavItemType, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";
import { RoleSwitcher } from "./role-switcher";
import { Logo } from "../icons";
import { Loader2 } from "lucide-react";
import { DateRangeProvider } from "@/providers/date-range-provider";
import { Notifications } from "./notifications";

const navItems: NavItemType[] = [
  { href: "/", title: "Dashboard", icon: LayoutDashboard, role: ["Admin", "Supervisor"] },
  { href: "/leads", title: "Leads / CRM", icon: PhoneCall, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/calendar", title: "Calendar", icon: Calendar, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/todos", title: "Daily To-Do", icon: CheckSquare, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/kpi", title: "KPI's & Performance", icon: TrendingUp, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/knowledge", title: "Knowledge Base", icon: BookOpen, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/staff", title: "Staff", icon: Users, role: ["Admin"] },
];

const hasAccess = (userRole: Role, requiredRoles: Role[]) => {
    return requiredRoles.includes(userRole);
}

function NavItem({ active, icon, label, href, onLinkClick }: { active: boolean; icon: React.ReactNode; label: string; href: string, onLinkClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onLinkClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        active ? 'bg-primary text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function MainNav({ items, onLinkClick }: { items: NavItemType[], onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthContext();

  if (!user) return null;
  
  return (
    <nav className="flex-1 p-4 space-y-2">
      {items.map((item) => (
        hasAccess(user.role, item.role) && (
          <NavItem 
            key={item.href}
            href={item.href}
            active={pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')}
            icon={<item.icon size={20} />}
            label={item.title}
            onLinkClick={onLinkClick}
          />
        )
      ))}
    </nav>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const { user, logout, MASTER_ADMIN_EMAIL } = useAuthContext();
    
    if (!user) return null;

    return (
        <>
            <div className="p-6 border-b border-slate-800 h-16 flex items-center">
                <Logo className="text-white text-lg" />
            </div>

            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
                        <UserCircle2 className="h-6 w-6 text-slate-500" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        {user.dui && <p className="text-xs text-slate-400 truncate">DUI: {user.dui}</p>}
                        <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
                    </div>
                </div>
            </div>
            
            <MainNav items={navItems} onLinkClick={onLinkClick} />

            <div className="p-4 border-t border-slate-800 mt-auto">
                <Notifications />
                {user.email === MASTER_ADMIN_EMAIL && <RoleSwitcher />}
                 <Button 
                    onClick={() => {
                      if (onLinkClick) onLinkClick();
                      logout();
                    }}
                    variant="ghost"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full justify-start text-sm p-2 h-auto"
                >
                    <LogOut size={16} /> Cerrar Sesión
                </Button>
            </div>
        </>
    );
}


function Sidebar() {
    return (
        <aside className="w-64 bg-slate-900 text-white flex-col shrink-0 hidden lg:flex">
           <SidebarContent />
        </aside>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (loading) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
            <Logo />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Application...</p>
        </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  // The AuthProvider handles redirection, but this prevents flashing content.
  if (!user) {
    return null;
  }

  const pagesToFilter = ['/kpi', '/staff', '/knowledge', '/todos', '/calendar'];
  // Hide date filter on specific pages and on any sub-path of /leads/
  const isDetailPage = pathname.startsWith('/leads/') && pathname.split('/').length > 2;
  const showDateFilter = (user.role === 'Admin' || user.role === 'Supervisor') && !pagesToFilter.some(p => pathname.startsWith(p)) && !isDetailPage;


  const getPageTitle = () => {
    if (pathname === '/kpi') return 'Daily Goals';
    if (pathname === '/') return 'Dashboard';
    const currentPath = pathname.split('/')[1];
    const currentNavItem = navItems.find(item => item.href === `/${currentPath}`);
    if (currentNavItem) return currentNavItem.title;
    if (pathname.includes('/leads/')) return 'Lead Details';
    if (pathname.includes('/staff/')) return 'Edit Staff Profile';
    return 'Dashboard';
  };

  return (
    <DateRangeProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-8 shrink-0">
            <div className="flex items-center gap-4">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="icon" variant="outline" className="lg:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs p-0 bg-slate-900 text-white border-r-0 flex flex-col">
                  <SheetHeader className="sr-only">
                      <SheetTitle>Mobile Menu</SheetTitle>
                  </SheetHeader>
                  <SidebarContent onLinkClick={() => setIsSheetOpen(false)} />
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-semibold text-slate-800 capitalize hidden sm:block">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-4">
              {showDateFilter && <DateRangePicker />}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </DateRangeProvider>
  );
}
