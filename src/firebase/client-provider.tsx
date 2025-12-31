'use client';

import { useState, useEffect, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import { initializeFirebase, FirebaseProvider } from './';

type FirebaseClientProviderProps = {
  children: ReactNode;
};

/**
 * A client-side component that initializes Firebase and provides it to its children.
 * This ensures that Firebase is only initialized on the client, preventing SSR issues.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseInstances, setFirebaseInstances] = useState<{
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    // The initializeFirebase function is idempotent,
    // so it's safe to call it on every render.
    const instances = initializeFirebase();
    setFirebaseInstances(instances);
  }, []);

  if (!firebaseInstances) {
    // You can render a loading indicator here if needed
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseInstances.firebaseApp}
      auth={firebaseInstances.auth}
      firestore={firebaseInstances.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
