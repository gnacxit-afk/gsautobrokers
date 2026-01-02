'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

// This component is deprecated and can be removed. 
// The FirebaseProvider now handles its own initialization logic.
interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <FirebaseProvider>
      {children}
    </FirebaseProvider>
  );
}
