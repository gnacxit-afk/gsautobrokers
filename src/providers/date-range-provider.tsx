"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
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
  // 1. Initialize state with a static, hardcoded value to ensure server and client renders match.
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    if (initialDateRange) {
      return initialDateRange;
    }
    // This static date is a placeholder to prevent hydration errors.
    // It will be immediately updated by the useEffect on the client.
    return {
        start: new Date(2024, 0, 1),
        end: new Date(2024, 0, 31)
    };
  });

  // 2. This effect runs only on the client, after the initial render.
  // It safely updates the state to the correct, dynamic date range.
  useEffect(() => {
    if (!initialDateRange) {
      setDateRangeState(getDefaultDateRange());
    }
  }, [initialDateRange]);


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
