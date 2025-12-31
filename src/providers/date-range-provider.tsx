"use client";

import React, { createContext, useState, useMemo } from 'react';
import { subDays } from 'date-fns';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange>>;
  clearAllFilters?: () => void;
}

export const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const DEFAULT_DATE_RANGE = {
  start: new Date('2000-01-01'),
  end: new Date('2100-01-01'),
};

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);

  const value = useMemo(() => ({ dateRange, setDateRange }), [dateRange]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}
