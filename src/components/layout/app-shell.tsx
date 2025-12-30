"use client";

import React from "react";
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
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import type { NavItem as NavItemType, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";
import { RoleSwitcher } from "./role-switcher";
import { Logo } from "../icons";

const navItems: NavItemType[] = [
  { href: "/", title: "Dashboard", icon: LayoutDashboard, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/leads", title: "Leads / CRM", icon: PhoneCall, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/knowledge", title: "Knowledge Base", icon: BookOpen, role: ["Admin", "Supervisor", "Broker"] },
  { href: "/staff", title: "Staff", icon: Users, role: ["Admin"] },
];

const hasAccess = (userRole: Role, requiredRoles: Role[]) => {
    return requiredRoles.includes(userRole);
}

function NavItem({ active, icon, label, href }: { active: boolean; icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
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

function MainNav({ items }: { items: NavItemType[] }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;
  
  return (
    <nav className="flex-1 p-4 space-y-2">
      {items.map((item) => (
        hasAccess(user.role, item.role) && (
          <NavItem 
            key={item.href}
            href={item.href}
            active={pathname === item.href}
            icon={<item.icon size={20} />}
            label={item.title}
          />
        )
      ))}
    </nav>
  );
}

function Sidebar() {
    const { user, logout } = useAuth();
    
    if (!user) return null;

    return (
        <aside className="w-64 bg-slate-900 text-white flex-col shrink-0 hidden md:flex">
            <div className="p-6 border-b border-slate-800 h-16 flex items-center">
                <Logo className="text-white text-lg" />
            </div>
            
            <MainNav items={navItems} />

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
                        <UserCircle2 className="h-6 w-6 text-slate-500" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">ID: {user.id}</p>
                    </div>
                </div>
                <RoleSwitcher />
                 <Button 
                    onClick={logout}
                    variant="ghost"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full justify-start mt-2 text-sm p-2 h-auto"
                >
                    <LogOut size={16} /> Cerrar Sesión
                </Button>
            </div>
        </aside>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    // You can return a global loading spinner here
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  if (!user && pathname !== '/login') {
    // AuthProvider should handle redirection, but this is a safeguard.
    return null;
  }
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const pagesWithDateFilter = ['/', '/leads'];
  const showDateFilter = pagesWithDateFilter.includes(pathname);


  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const currentPath = pathname.split('/')[1];
    const currentNavItem = navItems.find(item => item.href === `/${currentPath}`);
    return currentNavItem ? currentNavItem.title : '';
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="md:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:max-w-xs p-0 bg-slate-900 text-white border-r-0">
                <div className="p-6 border-b border-slate-800 h-16 flex items-center">
                    <Logo className="text-white text-lg" />
                </div>
                <MainNav items={navItems} />
              </SheetContent>
            </Sheet>
            <h2 className="text-xl font-semibold text-slate-800 capitalize">{getPageTitle()}</h2>
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
  );
}
