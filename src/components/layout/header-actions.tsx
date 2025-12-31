"use client";

import React, { useContext } from 'react';
import { DateRangePicker } from './date-range-picker';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { LeadsPageContext } from '@/providers/leads-page-provider';

function ClearFiltersButton() {
  // This hook will only be called when the button is rendered,
  // which is only when the context is available.
  const context = useContext(LeadsPageContext);
  
  if (!context || !context.clearAllFilters) {
    return null;
  }

  return (
    <Button variant="ghost" size="sm" onClick={context.clearAllFilters} className="flex items-center gap-1 text-muted-foreground">
      <X size={14} />
      Clear
    </Button>
  );
}

export function HeaderActions({ showDateFilter, page }: { showDateFilter: boolean, page: string }) {
  
  if (page === '/leads') {
    return (
      <div className="flex items-center gap-2">
        <DateRangePicker />
        <ClearFiltersButton />
      </div>
    );
  }

  if (showDateFilter) {
    return <DateRangePicker />;
  }
  
  return null;
}
