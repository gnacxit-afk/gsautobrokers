"use client";

import React from 'react';
import { format } from 'date-fns';
import { useDateRange } from '@/hooks/use-date-range';

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDateRange();

  const handleDateChange = (part: 'start' | 'end', value: string) => {
    const dateValue = value ? new Date(value + 'T00:00:00') : new Date();
    setDateRange(prev => ({ ...prev, [part]: dateValue }));
  };

  return (
    <div className="flex items-center gap-2 text-sm bg-gray-100 p-1 rounded-lg">
      <input 
        type="date" 
        value={format(dateRange.start, 'yyyy-MM-dd')} 
        onChange={e => handleDateChange('start', e.target.value)}
        className="bg-transparent border-none focus:ring-0 text-xs p-1"
        aria-label="Start date"
      />
      <span className="text-gray-400">to</span>
      <input 
        type="date" 
        value={format(dateRange.end, 'yyyy-MM-dd')}
        onChange={e => handleDateChange('end', e.target.value)}
        className="bg-transparent border-none focus:ring-0 text-xs p-1"
        aria-label="End date"
      />
    </div>
  );
}
