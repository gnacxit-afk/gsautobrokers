"use client";

import { useContext } from 'react';
import { DateRangeContext, getDefaultDateRange } from '@/providers/date-range-provider';

export const useDateRange = () => {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};

export { getDefaultDateRange };
