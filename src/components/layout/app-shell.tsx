
'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Loader2,
  UserX,
  Archive,
  type LucideIcon,
} from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/auth";
import type { NavItemGroup, Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RoleSwitcher } from "./role-switcher";
import { Logo } from "../icons";
import { Notifications } from "./notifications";
import { ContractSigningBanner } from '@/components/contracts/contract-signing-banner';
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LoginPage from "@/app/(auth)/login/page";

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
  UserX,
  Archive,
};

const navItems: NavItemGroup[] = [
  {
    heading: 'CRM',
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", role: ["Admin"] },
      { href: "/leads", label: "Leads / CRM", icon: "PhoneCall", role: ["Admin", "Supervisor", "Broker"] },
      { href: "/appointments", label: "Appointments", icon: "Calendar", role: ["Admin", "Supervisor", "Broker"] },
      { href: "/todos", label: "Daily To-Do", icon: "CheckSquare", role: ["Admin", "Supervisor", "Broker"] },
      { href: "/kpi", label: "KPI's & Performance", icon: "TrendingUp", role: ["Admin", "Supervisor", "Broker"] },
      { href: "/knowledge", label: "Knowledge Base", icon: "BookOpen", role: ["Admin", "Supervisor", "Broker"] },
      { href: "/staff", label: "Staff", icon: "Users", role: ["Admin", "Supervisor"] },
      { href: "/contracts", label: "Contracts", icon: "FileText", role: ["Admin"] },
    ]
  },
  {
    heading: 'Recruiting',
    role: ["Admin"],
    items: [
      { href: '/recruiting/dashboard', label: 'Recruiting Dashboard', icon: 'LayoutDashboard' },
      { href: '/recruiting/pipeline/new', label: 'New Applicants', icon: 'UserPlus' },
      { href: '/recruiting/pipeline/pre-filter-approved', label: 'Pre-Filter Approved', icon: 'Filter' },
      { href: '/recruiting/pipeline/5-minute-filter', label: '5-Minute Filter', icon: 'Clock5' },
      { href: '/recruiting/onboarding/approved', label: 'Approved for Onboarding', icon: 'UserCheck' },
      { href: '/recruiting/onboarding/onboarding', label: 'Onboarding', icon: 'Rocket' },
      { href: '/recruiting/rejected', label: 'Rejected', icon: 'UserX' },
      { href: '/recruiting/inactive', label: 'Inactive', icon: 'Archive' },
      { href: '/apply', label: 'Public Application Form', icon: 'Briefcase', target: '_blank' },
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
    <nav className="flex-1 px-4 space-y-2">
      <Accordion type="multiple" defaultValue={['CRM', 'Recruiting']} className="w-full">
        {items.map((group) => (
           hasAccess(user.role, group.role) && group.heading && group.items && Array.isArray(group.items) && (
            <AccordionItem key={group.heading} value={group.heading} className="border-b-0">
              <AccordionTrigger className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2 hover:no-underline hover:text-white data-[state=open]:text-white">
                {group.heading}
              </AccordionTrigger>
              <AccordionContent className="pb-0 pl-2 pr-1 space-y-1">
                {group.items.map(item => {
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
                })}
              </AccordionContent>
            </AccordionItem>
          )
        ))}
      </Accordion>
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


function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
    const { user, logout, MASTER_ADMIN_EMAIL } = useAuthContext();
    
    if (!user) return null;

    return (
        <>
            <div className="p-6 border-b border-slate-800 h-16 flex items-center shrink-0">
                <Logo className="text-white text-lg" />
            </div>

            <div className="p-4 border-b border-slate-800 shrink-0">
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
            
            <ScrollArea className="flex-1">
                 <MainNav items={navItems} onLinkClick={onLinkClick} />
            </ScrollArea>

            <div className="p-4 border-t border-slate-800 mt-auto shrink-0">
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
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
   useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);


  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-gray-100">
        <Logo />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading Application...</p>
      </div>
    );
  }

  if (!user) {
    // While redirecting, show a loading state or nothing to prevent flicker
    return null;
  }
  
  const getPageTitle = () => {
    const allItems = navItems.flatMap(g => g.items || []);
    
    let currentItem = allItems.find(item => item && item.href === pathname);
    
    if (!currentItem) {
       currentItem = allItems
         .filter(item => item && item.href && item.href !== '/')
         .sort((a, b) => b.href.length - a.href.length)
         .find(item => item && item.href && pathname.startsWith(item.href));
    }
    
    if (currentItem) return currentItem.label;

    // Handle special dynamic routes
    if (pathname.startsWith('/leads/')) return 'Lead Details';
    if (pathname.startsWith('/staff/')) return 'Staff Profile';

    return 'Dashboard';
  };


  return (
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
               {/* Any header actions can go here */}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
             <ContractSigningBanner />
            {children}
          </div>
        </main>
      </div>
  );
}
