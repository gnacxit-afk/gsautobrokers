"use client";

import React, { createContext, useState, useMemo, useContext, ReactNode } from 'react';

interface LeadsPageContextType {
  clearAllFilters: () => void;
  setClearAllFilters: (fn: () => void) => void;
}

const LeadsPageContext = createContext<LeadsPageContextType | undefined>(undefined);

export function LeadsPageProvider({ children }: { children: ReactNode }) {
  const [clearAllFilters, setClearAllFiltersState] = useState<() => void>(() => () => {});

  const setClearAllFilters = (fn: () => void) => {
    setClearAllFiltersState(() => fn);
  };
  
  const value = useMemo(() => ({
    clearAllFilters,
    setClearAllFilters,
  }), [clearAllFilters]);

  return (
    <LeadsPageContext.Provider value={value}>
      {children}
    </LeadsPageContext.Provider>
  );
}

export const useLeadsPage = () => {
  const context = useContext(LeadsPageContext);
  if (!context) {
    throw new Error('useLeadsPage must be used within a LeadsPageProvider');
  }
  return context;
};
