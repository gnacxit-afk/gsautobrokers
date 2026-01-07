
"use client";

import React, { createContext, useState, useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (newRange: DateRange) => void;
  resetDateRange: () => void;
}

export const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const getDefaultDateRange = (): DateRange => ({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date()),
});

interface DateRangeProviderProps {
  children: React.ReactNode;
  initialDateRange?: DateRange;
  onDateChange?: (dateRange: DateRange) => void;
}

export function DateRangeProvider({ children, initialDateRange, onDateChange }: DateRangeProviderProps) {
  const [dateRange, setDateRangeState] = useState<DateRange>(initialDateRange || getDefaultDateRange());

  const setDateRange = useCallback((newRange: React.SetStateAction<DateRange>) => {
    const resolvedRange = typeof newRange === 'function' ? newRange(dateRange) : newRange;
    setDateRangeState(resolvedRange);
    if (onDateChange) {
      onDateChange(resolvedRange);
    }
  }, [dateRange, onDateChange]);

  const resetDateRange = useCallback(() => {
    const defaultRange = getDefaultDateRange();
    setDateRangeState(defaultRange);
    if (onDateChange) {
      onDateChange(defaultRange);
    }
  }, [onDateChange]);

  const value = useMemo(() => ({ dateRange, setDateRange: setDateRange as any, resetDateRange }), [dateRange, setDateRange, resetDateRange]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}
