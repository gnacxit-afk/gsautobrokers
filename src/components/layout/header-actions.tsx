"use client";

import React from 'react';
import { DateRangePicker } from './date-range-picker';
import { useDateRange } from '@/hooks/use-date-range';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { useLeadsPage } from '@/providers/leads-page-provider';

export function HeaderActions({ showDateFilter, page }: { showDateFilter: boolean, page: string }) {
  const { clearAllFilters } = useLeadsPage();

  if (page === '/leads') {
    return (
      <div className="flex items-center gap-2">
        <DateRangePicker />
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="flex items-center gap-1 text-muted-foreground">
          <X size={14} />
          Clear
        </Button>
      </div>
    );
  }

  if (showDateFilter) {
    return <DateRangePicker />;
  }
  
  return null;
}
