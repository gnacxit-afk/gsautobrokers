
import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";

export type Role = "Admin" | "Supervisor" | "Broker";

export type User = {
  id: string; // This will now be the Firestore document ID
  authUid: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: Role;
  dui?: string;
};

export type NoteEntry = {
  id: string;
  content: string;
  author: string;
  date: Timestamp | Date | string;
  type: 'Manual' | 'Stage Change' | 'Owner Change' | 'System';
}

export type LeadStatus = "Hot" | "Warm" | "In Nurturing" | "Cold";

export type Lead = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company?: string;
  stage: "Nuevo" | "Calificado" | "Citado" | "En Seguimiento" | "Ganado" | "Perdido";
  ownerId: string; // This will be the staff member's document ID
  ownerName: string;
  channel: 'Facebook' | 'WhatsApp' | 'Call' | 'Visit' | 'Other';
  createdAt: Timestamp | Date | string;
  language: 'English' | 'Spanish';
  lastActivity?: Timestamp | Date | string;
  leadStatus?: LeadStatus;
};

export type Article = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: Timestamp | Date | string;
  tags: string[];
  category: string;
  align?: 'left' | 'center' | 'right';
};

export type Staff = {
  id: string; // Firestore document ID
  authUid: string; // Firebase Auth UID
  name: string;
  email: string;
  password?: string;
  role: Role;
  hireDate: Timestamp | Date | string;
  avatarUrl: string;
  supervisorId?: string; // This will be the supervisor's document ID
  createdAt: Timestamp | Date | string;
  dui?: string;
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
  userId: string; // Staff document ID
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
