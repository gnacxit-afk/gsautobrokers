

'use client';

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
  FileText,
  UserPlus,
  Filter,
  Clock5,
  UserCheck,
  Rocket,
  Briefcase,
  Target,
  Building,
  LineChart,
  type LucideIcon,
} from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/auth";
import type { NavItemGroup, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";
import { RoleSwitcher } from "./role-switcher";
import { Logo } from "../icons";
import { Loader2 } from "lucide-react";
import { DateRangeProvider } from "@/providers/date-range-provider";
import { Notifications } from "./notifications";
import { ContractSigningBanner } from '../contracts/contract-signing-banner';
import { Avatar, AvatarFallback } from "../ui/avatar";

const icons: { [key: string]: LucideIcon } = {
  LayoutDashboard,
  PhoneCall,
  Calendar,
  CheckSquare,
  TrendingUp,
  BookOpen,
  Users,
  FileText,
  UserPlus,
  Filter,
  Clock5,
  UserCheck,
  Rocket,
  Briefcase,
  Target,
  Building,
  LineChart,
};

const crmNav: NavItemGroup[] = [
  { href: "/crm/dashboard", title: "Dashboard", icon: "LayoutDashboard", role: ["Admin", "Supervisor"] },
  { href: "/crm/leads", title: "Leads / CRM", icon: "PhoneCall", role: ["Admin", "Supervisor", "Broker"] },
  { href: "/crm/appointments", title: "Appointments", icon: "Calendar", role: ["Admin", "Supervisor", "Broker"] },
  { href: "/crm/todos", title: "Daily To-Do", icon: "CheckSquare", role: ["Admin", "Supervisor", "Broker"] },
  { href: "/crm/kpi", title: "KPI's & Performance", icon: "TrendingUp", role: ["Admin", "Supervisor", "Broker"] },
  { href: "/crm/knowledge", title: "Knowledge Base", icon: "BookOpen", role: ["Admin", "Supervisor", "Broker"] },
  { href: "/crm/staff", title: "Staff", icon: "Users", role: ["Admin", "Supervisor"] },
  { href: "/crm/contracts", title: "Contracts", icon: "FileText", role: ["Admin"] },
];

const recruitingNav: NavItemGroup[] = [
  {
    heading: 'Candidate Pipeline',
    items: [
      { href: '/recruiting/pipeline/new', label: 'New Applicants', icon: 'UserPlus' },
      { href: '/recruiting/pipeline/pre-filter-approved', label: 'Pre-Filter Approved', icon: 'Filter' },
      { href: '/recruiting/pipeline/5-minute-filter', label: '5-Minute Filter', icon: 'Clock5' },
    ],
  },
  {
    heading: 'Onboarding Process',
    items: [
      { href: '/recruiting/onboarding/approved', label: 'Approved', icon: 'UserCheck' },
      { href: '/recruiting/onboarding/onboarding', label: 'Onboarding', icon: 'Rocket' },
    ],
  },
  {
    heading: 'Application',
    items: [
      { href: '/apply', label: 'Candidate Application', icon: 'FileText', target: '_blank' },
    ],
  },
];


const hasAccess = (userRole: Role, requiredRoles?: Role[]) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(userRole);
}

function NavItem({ active, icon, label, href, onLinkClick, target }: { active: boolean; icon: React.ReactNode; label: string; href: string, onLinkClick?: () => void, target?: string }) {
  return (
    <Link
      href={href}
      target={target}
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

function MainNav({ items, onLinkClick }: { items: NavItemGroup[], onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthContext();

  if (!user) return null;
  
  return (
    <nav className="flex-1 p-4 space-y-2">
      {items.map((group, index) => (
        <div key={index}>
            {group.heading && <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mt-4 mb-2">{group.heading}</h3>}
            {Array.isArray(group.items) ? group.items.map(item => {
                 const Icon = icons[item.icon];
                 return hasAccess(user.role, item.role) && (
                    <NavItem 
                        key={item.href}
                        href={item.href}
                        active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                        icon={<Icon size={20} />}
                        label={item.label}
                        onLinkClick={onLinkClick}
                        target={item.target}
                    />
                )
            }) : (
                <>
                {
                    (() => {
                        const Icon = icons[group.icon!];
                        return hasAccess(user.role, group.role) && (
                            <NavItem 
                                key={group.href}
                                href={group.href!}
                                active={pathname === group.href || (group.href !== "/" && pathname.startsWith(group.href!))}
                                icon={<Icon size={20} />}
                                label={group.title!}
                                onLinkClick={onLinkClick}
                            />
                        )
                    })()
                }
                </>
            )}
        </div>
      ))}
    </nav>
  );
}

const getAvatarFallback = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}


function SidebarContent({ onLinkClick, navItems }: { onLinkClick?: () => void, navItems: NavItemGroup[] }) {
    const { user, logout, MASTER_ADMIN_EMAIL } = useAuthContext();
    
    if (!user) return null;

    return (
        <>
            <div className="p-6 border-b border-slate-800 h-16 flex items-center">
                <Logo className="text-white text-lg" />
            </div>

            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                     <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-slate-700 text-slate-300 text-sm font-bold">
                            {getAvatarFallback(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
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


function Sidebar({ navItems }: { navItems: NavItemGroup[] }) {
    return (
        <aside className="w-64 bg-slate-900 text-white flex-col shrink-0 hidden lg:flex">
           <SidebarContent navItems={navItems} />
        </aside>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navItems = pathname.startsWith('/recruiting') ? recruitingNav : crmNav;
  
  if (loading) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
            <Logo />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Application...</p>
        </div>
    );
  }

  if (pathname === '/login' || pathname === '/apply') {
    return <>{children}</>;
  }

  // The AuthProvider handles redirection, but this prevents flashing content.
  if (!user) {
    return null;
  }

  const pagesToExcludeFilter = ['/crm/kpi', '/crm/staff', '/crm/knowledge', '/crm/todos', '/crm/appointments', '/crm/leads', '/crm/contracts'];
  const showDateFilter = (user.role === 'Admin' || user.role === 'Supervisor') && !pagesToExcludeFilter.some(p => pathname.startsWith(p));


  const getPageTitle = () => {
    for (const group of navItems) {
        if (group.items) {
            for (const item of group.items) {
                if (pathname.startsWith(item.href)) {
                    return item.label;
                }
            }
        } else if (group.href && pathname.startsWith(group.href)) {
            return group.title;
        }
    }

    if (pathname.startsWith('/crm/')) return 'CRM';
    if (pathname.startsWith('/recruiting/')) return 'Recruiting';

    return 'Dashboard';
  };

  return (
    <DateRangeProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-900">
        <Sidebar navItems={navItems} />
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
                  <SidebarContent onLinkClick={() => setIsSheetOpen(false)} navItems={navItems} />
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-semibold text-slate-800 capitalize hidden sm:block">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-4">
              {showDateFilter && <DateRangePicker />}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
             <ContractSigningBanner />
            {children}
          </div>
        </main>
      </div>
    </DateRangeProvider>
  );
}

    