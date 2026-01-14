

import type { LucideIcon } from "lucide-react";
import type { Timestamp } from "firebase/firestore";
import { z } from 'zod';


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
  id:string;
  content: string;
  author: string;
  date: Timestamp | Date | string;
  type: 'Manual' | 'Stage Change' | 'Owner Change' | 'System' | 'AI Analysis';
}

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
};

export type Appointment = {
  id: string;
  leadId: string;
  leadName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  ownerId: string;
  status: "Hot" | "Warm" | "Cold" | "Unknown";
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
  label: string;
  icon: string;
  target?: string;
  role?: Role[];
};

export type NavItemGroup = {
    heading?: string;
    items?: NavItem[];
    // For single items not under a heading
    href?: string;
    title?: string;
    icon?: string;
    role?: Role[];
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

export type Notification = {
    id: string;
    userId: string; // Staff document ID this notification is for
    content: string;
    leadId?: string;
    leadName?: string;
    createdAt: Timestamp;
    read: boolean;
    author: string;
};

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Timestamp;
  userId: string;
  leadId?: string;
  leadName?: string;
};


export type EmploymentContract = {
  id: string;
  title: string;
  version: string;
  content: string;
  isActive: boolean;
  createdAt: Timestamp;
};

export type ContractSignature = {
  id: string;
  userId: string;
  userName: string;
  contractId: string;
  contractVersion: string;
  signedAt: Timestamp;
  ipAddress: string;
};

export type ContractEvent = {
  id: string;
  contractId: string;
  contractTitle: string;
  contractVersion: string;
  userEmail: string;
  userName: string;
  eventType: 'Created' | 'Activated' | 'Archived';
  timestamp: Timestamp;
};


export type Candidate = {
  id: string;
  fullName: string;
  email: string;
  pipelineStatus: 'New Applicant' | 'Applied' | 'Pre-Filter' | '5-Minute Filter' | 'Approved' | 'Onboarding' | 'Active' | 'Rejected';
  appliedDate: Timestamp | string;
  lastStatusChangeDate: Timestamp | string;
  approvedBy?: string; // Recruiter's name or ID
  avatarUrl?: string;
  source?: string;
  recruiter?: string;
  [key: string]: any;
};
