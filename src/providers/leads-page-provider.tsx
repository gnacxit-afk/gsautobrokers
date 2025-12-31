"use client";

import React, { createContext, useState, useMemo, useContext, ReactNode, useCallback } from 'react';

interface LeadsPageContextType {
  clearAllFilters: (() => void) | null;
  setClearAllFilters: (fn: () => void) => void;
}

export const LeadsPageContext = createContext<LeadsPageContextType | undefined>(undefined);

export function LeadsPageProvider({ children }: { children: ReactNode }) {
  const [clearFn, setClearFn] = useState<(() => void) | null>(null);
  
  const setClearAllFilters = useCallback((fn: () => void) => {
    setClearFn(() => fn);
  }, []);

  const value = useMemo(() => ({
    clearAllFilters: clearFn,
    setClearAllFilters,
  }), [clearFn, setClearAllFilters]);

  return (
    <LeadsPageContext.Provider value={value}>
      {children}
    </LeadsPageContext.Provider>
  );
}

export const useLeadsPage = () => {
  const context = useContext(LeadsPageContext);
  if (context === undefined) {
    throw new Error('useLeadsPage must be used within a LeadsPageProvider');
  }
  return context;
};
