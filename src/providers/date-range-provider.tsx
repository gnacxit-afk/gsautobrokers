
"use client";

import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (newRange: Partial<DateRange>) => void;
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
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    if (initialDateRange) {
      return initialDateRange;
    }
    // Use a static date for the initial render to prevent hydration mismatch.
    return {
        start: new Date(2024, 0, 1),
        end: new Date(2024, 0, 31)
    };
  });

  // This effect runs only on the client to set the correct dynamic default date range.
  useEffect(() => {
    if (!initialDateRange) {
      setDateRangeState(getDefaultDateRange());
    }
  }, [initialDateRange]);


  const setDateRange = useCallback((newRange: Partial<DateRange>) => {
    setDateRangeState(prev => {
        const resolvedRange = { ...prev, ...newRange };
        if (onDateChange) {
            onDateChange(resolvedRange);
        }
        return resolvedRange;
    });
  }, [onDateChange]);

  const resetDateRange = useCallback(() => {
    const defaultRange = getDefaultDateRange();
    setDateRangeState(defaultRange);
    if (onDateChange) {
      onDateChange(defaultRange);
    }
  }, [onDateChange]);

  const value = useMemo(() => ({ dateRange, setDateRange, resetDateRange }), [dateRange, setDateRange, resetDateRange]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}
