
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DayPicker, DayProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  isToday,
  isValid,
} from 'date-fns';
import { User, CheckCircle2, XCircle, Calendar as CalendarIcon, Briefcase, FilePen, ChevronLeft, ChevronRight, Plus, ExternalLink, Edit } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';

export function AppointmentCalendar({
  appointments,
  allStaff,
  leadToOpen,
  visibleLeads,
  onUserFilterChange,
  selectedUserId,
}: {
  appointments: Lead[];
  allStaff: Staff[];
  leadToOpen: Lead | null;
  visibleLeads: Lead[];
  onUserFilterChange: (userId: string) => void;
  selectedUserId: string;
}) {
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isAppointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    if (leadToOpen) {
      setEditingLead(leadToOpen);
      setAppointmentDialogOpen(true);
      if (leadToOpen.appointment?.date) {
        const leadDate = (leadToOpen.appointment.date as any).toDate ? (leadToOpen.appointment.date as any).toDate() : new Date(leadToOpen.appointment.date as string);
        setSelectedDay(leadDate);
        setCurrentMonth(leadDate);
      }
    }
  }, [leadToOpen]);

  const appointmentsByDate = useMemo(() => {
    const grouped: { [key: string]: Lead[] } = {};
    visibleLeads.forEach((lead) => {
      if (lead.appointment?.date) {
         const leadDate = (lead.appointment.date as any).toDate ? (lead.appointment.date as any).toDate() : new Date(lead.appointment.date as string);
         if(isValid(leadDate)) {
            const day = format(leadDate, 'yyyy-MM-dd');
            if (!grouped[day]) {
                grouped[day] = [];
            }
            grouped[day].push(lead);
         }
      }
    });
    return grouped;
  }, [visibleLeads]);
  
  const appointmentsForSelectedDay = useMemo(() => {
    const day = format(selectedDay, 'yyyy-MM-dd');
    return (appointmentsByDate[day] || []).sort((a, b) => {
        const timeA = a.appointment?.time || '00:00';
        const timeB = b.appointment?.time || '00:00';
        return timeA.localeCompare(timeB);
    });
  }, [selectedDay, appointmentsByDate]);
  
  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setAppointmentDialogOpen(true);
  };
  
  const { citasEsteMes, citasHoy, sinConfirmarHoy } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    let citasEsteMes = 0;
    let citasHoy = 0;
    let sinConfirmarHoy = 0;
    
    Object.entries(appointmentsByDate).forEach(([dateStr, leads]) => {
      const date = new Date(dateStr);
      if (isSameMonth(date, currentMonth)) {
        citasEsteMes += leads.length;
      }
      if (isToday(date)) {
        citasHoy = leads.length;
        sinConfirmarHoy = leads.filter(l => !l.appointment?.confirmed).length;
      }
    });
    return { citasEsteMes, citasHoy, sinConfirmarHoy };
  }, [currentMonth, appointmentsByDate]);

  const assignableUsers = useMemo(() => {
    if (!user || !allStaff) return [];
    if (user.role === 'Admin') return allStaff.filter(s => ['Admin', 'Supervisor', 'Broker'].includes(s.role));
    if (user.role === 'Supervisor') {
        const teamIds = allStaff.filter(s => s.supervisorId === user.id).map(s => s.id);
        const visibleIds = [user.id, ...teamIds];
        return allStaff.filter(s => visibleIds.includes(s.id));
    }
    return [];
  }, [user, allStaff]);


  const CustomDay = (props: DayProps) => {
      if (!props.date || !isValid(props.date)) return <td className="rdp-cell"></td>;
      const hasAppointment = appointmentsByDate[format(props.date, 'yyyy-MM-dd')]?.length > 0;
      const isSelected = isSameDay(props.date, selectedDay);
      const isTodayDate = isToday(props.date);
      
      return (
          <td className="rdp-cell" role="gridcell">
              <button
                  disabled={props.disabled}
                  onClick={() => setSelectedDay(props.date)}
                  className={cn("rdp-button_reset rdp-button rdp-day", {
                    "bg-primary text-primary-foreground": isSelected,
                    "text-primary border-2 border-primary": isTodayDate && !isSelected,
                    "hover:bg-accent": !isSelected
                  })}
              >
                  {format(props.date, 'd')}
                  {hasAppointment && <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-accent-foreground"></span>}
              </button>
          </td>
      );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="p-3">
             <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={(day) => setSelectedDay(day || new Date())}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="p-0"
                classNames={{
                    months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                    month: 'space-y-4',
                    caption_label: 'text-lg font-bold',
                    head_row: 'flex justify-around text-xs text-muted-foreground uppercase',
                    head_cell: 'w-full',
                    row: 'flex w-full mt-2 justify-around',
                    cell: 'w-9 h-9 text-center p-0 relative',
                    day: cn(
                        buttonVariants({ variant: 'ghost' }),
                        'h-9 w-9 p-0 font-normal relative'
                    ),
                    day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                    day_today: 'bg-accent text-accent-foreground',
                }}
             />
          </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle className="text-base">Resumen Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Citas este mes:</span> <span className="font-bold">{citasEsteMes}</span></div>
                <div className="flex justify-between"><span>Citas hoy:</span> <span className="font-bold">{citasHoy}</span></div>
                <div className="flex justify-between"><span>Sin confirmar hoy:</span> <span className="font-bold text-amber-600">{sinConfirmarHoy}</span></div>
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
         <div className="flex flex-col md:flex-row justify-between items-baseline mb-4 gap-4">
            <h2 className="text-xl font-bold">
                Citas para <span className="text-primary">{isToday(selectedDay) ? 'Hoy' : format(selectedDay, 'MMM d, yyyy')}</span>
            </h2>
            {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                 <Select value={selectedUserId} onValueChange={onUserFilterChange}>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Filtrar por broker..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los brokers</SelectItem>
                        {assignableUsers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
        </div>
        
        {appointmentsForSelectedDay.length > 0 ? (
          <div className="space-y-4">
            {appointmentsForSelectedDay.map(lead => (
              <Card key={lead.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                        "w-2 h-16 rounded-full", 
                        lead.appointment?.confirmed ? 'bg-green-500' : 'bg-amber-500'
                    )}></div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                             <span className={cn(
                                "text-xs font-bold px-2 py-0.5 rounded-full",
                                lead.appointment?.confirmed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            )}>
                                {lead.appointment?.time || 'Todo el día'}
                            </span>
                             <span className={cn(
                                "text-xs font-semibold",
                                lead.appointment?.confirmed ? 'text-green-600' : 'text-amber-600'
                            )}>
                                {lead.appointment?.confirmed ? 'Confirmada' : 'Sin Confirmar'}
                            </span>
                        </div>
                        <p className="font-bold text-lg text-slate-800 mt-1">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">Broker: {lead.ownerName}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                       <Button variant="outline" size="sm" onClick={() => router.push(`/leads/${lead.id}/notes`)}>
                            <ExternalLink size={14} className="mr-2"/> Abrir Lead
                        </Button>
                        <Button size="sm" onClick={() => handleEditClick(lead)}>
                           <Edit size={14} className="mr-2"/> Editar
                        </Button>
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="h-96 flex flex-col items-center justify-center text-center p-6 border-dashed">
             <CalendarIcon size={48} className="text-slate-300 mb-4" />
             <h3 className="font-semibold text-lg text-slate-700">No hay citas para este día</h3>
             <p className="text-sm text-muted-foreground max-w-xs">
                Aprovecha para confirmar citas futuras o agendar nuevos leads.
             </p>
          </Card>
        )}
      </div>
        
      {editingLead && (
        <AppointmentDialog 
          lead={editingLead} 
          open={isAppointmentDialogOpen} 
          onOpenChange={setAppointmentDialogOpen}
          onDateSet={() => setAppointmentDialogOpen(false)}
        />
      )}
    </div>
  );
}
