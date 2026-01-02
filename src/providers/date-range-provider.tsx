"use client";

import React, { createContext, useState, useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  resetDateRange: () => void;
}

export const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const getDefaultDateRange = (): DateRange => ({
  start: startOfMonth(new Date()),
  end: endOfMonth(new Date()),
});

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const resetDateRange = () => {
    setDateRange(getDefaultDateRange());
  };

  const value = useMemo(() => ({ dateRange, setDateRange, resetDateRange }), [dateRange]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}
