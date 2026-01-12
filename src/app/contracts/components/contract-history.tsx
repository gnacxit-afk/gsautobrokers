'use client';

import type { ContractEvent } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, PlusCircle, Archive } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContractHistoryProps {
  events: ContractEvent[];
  loading: boolean;
}

const eventIcons = {
  Created: <PlusCircle size={16} />,
  Activated: <CheckCircle size={16} />,
  Archived: <Archive size={16} />,
};

const eventColors = {
  Created: 'bg-blue-100 text-blue-700',
  Activated: 'bg-green-100 text-green-700',
  Archived: 'bg-slate-100 text-slate-700',
};

export function ContractHistory({ events, loading }: ContractHistoryProps) {
  const renderDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return format(jsDate, "d MMM, h:mm a", { locale: es });
  };
  
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6 space-y-6">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
              ))
            ) : events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className="flex items-start gap-4">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${eventColors[event.eventType] || eventColors.Archived}`}>
                    {eventIcons[event.eventType] || eventIcons.Archived}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {event.userName}{' '}
                      <span className="text-muted-foreground font-normal">
                        {event.eventType === 'Created' ? 'created' : 'activated'} contract "{event.contractTitle}" (v{event.contractVersion})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground" title={format(event.timestamp.toDate(), 'PPPppp')}>
                      {formatDistanceToNow(event.timestamp.toDate(), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center text-muted-foreground p-8">
                No contract history recorded yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
