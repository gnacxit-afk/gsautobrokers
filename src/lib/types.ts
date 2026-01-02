import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

export type Role = "Admin" | "Supervisor" | "Broker";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  dui: string;
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
  createdAt: Timestamp | Date | string;
  language: 'English' | 'Spanish';
};

export type Article = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: Timestamp | Date | string;
  tags: string[];
  category: string;
};

export type Staff = {
  id:string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  hireDate: Timestamp | Date | string;
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

export type KPI = {
  id: string;
  label: string;
  target: string;
  description: string;
};

export type PerformanceMetric = {
  userId: string;
  userName: string;
  leadsRecibidos: number;
  numerosObtenidos: number;
  citasAgendadas: number;
  citasConfirmadas: number;
  leadsDescartados: number;
  ventas: number;
};

export type BonusInfo = {
  sales: number;
  bonus: number;
  nextGoal: number;
  needed: number;
};
