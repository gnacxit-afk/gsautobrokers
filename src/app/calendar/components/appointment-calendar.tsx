
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  isToday,
  isValid,
} from 'date-fns';
import { User, CheckCircle2, XCircle, Calendar as CalendarIcon, Briefcase, FilePen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Lead, Staff } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { AppointmentDialog } from './appointment-dialog';
import { useAuthContext } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';


export function AppointmentCalendar({ appointments, allStaff, leadToOpen }: { appointments: Lead[], allStaff: Staff[], leadToOpen: Lead | null }) {
    return (
        <div style={{ padding: 20, background: 'white', border: '1px solid #ccc' }}>
          <DayPicker />
        </div>
      );
}
