
'use client';

import { useState, useEffect } from 'react';
import type { DailyChecklist, ChecklistTask } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const CHECKLIST_STRUCTURE = {
  checkIn: {
    title: "CHECK-IN MATUTINO (15 min)",
    tasks: [
      { id: 'rev_msg', label: 'Revisar mensajes pendientes' },
      { id: 'rev_leads', label: 'Revisar leads de ayer (cantidad y calidad)' },
      { id: 'rev_citas_hoy', label: 'Revisar citas programadas para hoy' },
      { id: 'rev_citas_manana', label: 'Revisar citas programadas para mañana' },
      { id: 'scripts_open', label: 'Tener scripts abiertos (NO improvisar)' },
      { id: 'rev_fb_marketplace', label: 'Revisar FB Marketplace (Publicar/renovar inventario)' },
      { id: 'set_priorities', label: 'Asignar prioridades del día' },
    ]
  },
  duringDay: {
    title: "DURANTE EL DÍA",
    tasks: [
      { id: 'resp_leads', label: 'Responder leads nuevos en menos de 5 minutos' },
      { id: 'use_scripts', label: 'Usar scripts oficiales en cada conversación' },
      { id: 'get_phone', label: 'Pedir número de teléfono en los primeros 3 mensajes' },
      { id: 'schedule_appts', label: 'Agendar citas con día y hora específicos' },
      { id: 'confirm_appts_today', label: 'Confirmar citas del día' },
      { id: 'log_notes', label: 'Registrar cada lead trabajado con notas detalladas en CRM' },
      { id: 'follow_up_calls', label: 'Realizar llamadas de seguimiento' },
      { id: 'gen_new_leads', label: 'Generar nuevos leads continuamente' },
    ]
  },
  dailyGoals: {
    title: "OBJETIVOS DIARIOS MÍNIMOS",
    tasks: [
      { id: 'goal_leads', label: '10 leads obtenidos' },
      { id: 'goal_phones', label: '10 números de teléfono obtenidos' },
      { id: 'goal_appts', label: '8 citas agendadas' },
      { id: 'goal_confirmed', label: '5 citas confirmadas' },
    ]
  },
  checkOut: {
    title: "CHECK-OUT VESPERTINO (15 min)",
    tasks: [
      { id: 'follow_up_unanswered', label: 'Seguimiento a leads no respondidos' },
      { id: 'confirm_appts_next_day', label: 'Confirmar citas del día siguiente' },
      { id: 'consolidate_numbers', label: 'Consolidar números del día en reporte' },
      { id: 'analyze_performance', label: 'Análisis rápido de performance personal' },
      { id: 'report_issues', label: 'Identificar y reportar issues encontrados durante el día' },
      { id: 'plan_tomorrow', label: 'Planear prioridades para mañana' },
      { id: 'report_results', label: 'Reportar resultados al supervisor' },
    ]
  }
};

type SectionKey = keyof typeof CHECKLIST_STRUCTURE;

interface DailyChecklistProps {
  checklistData: DailyChecklist | null;
  loading: boolean;
}

export function DailyChecklistComponent({ checklistData, loading }: DailyChecklistProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [tasks, setTasks] = useState<DailyChecklist['tasks']>({});

  useEffect(() => {
    if (checklistData) {
      setTasks(checklistData.tasks || {});
    } else {
      const initialTasks: DailyChecklist['tasks'] = {};
      Object.values(CHECKLIST_STRUCTURE).forEach(section => {
        section.tasks.forEach(task => {
          initialTasks[task.id] = { completed: false, timestamp: null };
        });
      });
      setTasks(initialTasks);
    }
  }, [checklistData]);

  const handleTaskToggle = async (taskId: string) => {
    if (!user || !firestore) return;

    const task = tasks[taskId];
    if (task.completed) {
      const completionTime = (task.timestamp as any)?.toDate();
      if (completionTime && (new Date().getTime() - completionTime.getTime()) > 5 * 60 * 1000) {
        alert("No se puede desmarcar una tarea después de 5 minutos.");
        return;
      }
    }
    
    const newTasks = {
      ...tasks,
      [taskId]: {
        completed: !task.completed,
        timestamp: !task.completed ? serverTimestamp() : null,
      },
    };
    setTasks(newTasks);

    const checklistRef = doc(firestore, `checklists/${user.id}/${today}`);
    await setDoc(checklistRef, {
        userId: user.id,
        tasks: newTasks,
        metadata: {
            lastUpdated: serverTimestamp()
        }
    }, { merge: true });
  };
  
  const renderSection = (key: SectionKey) => {
    const section = CHECKLIST_STRUCTURE[key];
    const completedCount = section.tasks.filter(t => tasks[t.id]?.completed).length;
    const totalCount = section.tasks.length;
    const isProductivityWarning = key === 'dailyGoals' && completedCount < totalCount;

    return (
      <AccordionItem value={key}>
        <AccordionTrigger>
          <div className="flex justify-between items-center w-full pr-4">
            <span className="font-semibold">{section.title}</span>
            <span className="text-sm text-muted-foreground">{completedCount} / {totalCount}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pl-2">
          {section.tasks.map(task => {
            const taskState = tasks[task.id];
            return (
              <TooltipProvider key={task.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50">
                      <Checkbox
                        id={task.id}
                        checked={taskState?.completed}
                        onCheckedChange={() => handleTaskToggle(task.id)}
                      />
                      <Label htmlFor={task.id} className="text-sm font-normal cursor-pointer">
                        {task.label}
                      </Label>
                    </div>
                  </TooltipTrigger>
                  {taskState?.completed && taskState.timestamp && (
                    <TooltipContent>
                      <p>Completed at: {format((taskState.timestamp as any).toDate(), 'pp')}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {isProductivityWarning && (
              <AlertTriangle className="h-4 w-4 text-amber-500 inline-block mr-2" />
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };
  
  if (loading) {
      return (
          <Card>
              <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-10 w-1/4" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
              </CardContent>
          </Card>
      )
  }

  const allTasks = Object.values(CHECKLIST_STRUCTURE).flatMap(s => s.tasks);
  const totalCompleted = allTasks.filter(t => tasks[t.id]?.completed).length;
  const totalTasks = allTasks.length;
  const overallProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Broker Checklist</CardTitle>
        <CardDescription>Complete these tasks daily to ensure maximum productivity and compliance.</CardDescription>
         <div className="pt-4">
            <div className="flex justify-between items-center mb-1">
                <Label>Overall Progress</Label>
                <span className="text-sm font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} />
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['checkIn', 'duringDay', 'dailyGoals', 'checkOut']} className="w-full">
          {renderSection('checkIn')}
          {renderSection('duringDay')}
          {renderSection('dailyGoals')}
          {renderSection('checkOut')}
        </Accordion>
        <div className="mt-4 p-4 text-center text-xs text-muted-foreground bg-slate-50 rounded-md">
            <p>
                This checklist resets automatically every day at midnight. 
                The "Daily Goals" are self-reported for now. Automated tracking will be implemented in a future update.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}

