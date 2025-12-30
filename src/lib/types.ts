import type { LucideIcon } from "lucide-react";

export type Role = "Admin" | "Supervisor" | "Broker";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
};

export type Lead = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  status: "New" | "Contacted" | "Qualified" | "On the way" | "On site" | "Sale" | "Closed" | "Lost";
  notes?: string;
  ownerId: string;
  ownerName: string;
  channel: 'Facebook' | 'WhatsApp' | 'Call' | 'Visit' | 'Other';
  createdAt: string;
};

export type Article = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  category: string;
};

export type Staff = {
  id:string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  hireDate: string;
  avatarUrl: string;
  dui: string;
  supervisorId?: string;
};

export type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
  role: Role[];
};
