'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

interface FirebaseClientContextState {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// This pattern ensures that Firebase is initialized only once on the client.
function initializeFirebaseClientServices(): FirebaseClientContextState {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
}

// We are using a context here to ensure that the initialization
// only happens once, and the instances are shared across the app.
const FirebaseClientContext = createContext<FirebaseClientContextState | undefined>(undefined);

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const firebaseServices = useMemo(() => initializeFirebaseClientServices(), []);

  return (
    <FirebaseClientContext.Provider value={firebaseServices}>
      <FirebaseProvider
        firebaseApp={firebaseServices.app}
        firestore={firebaseServices.firestore}
        auth={firebaseServices.auth}
      >
        {children}
      </FirebaseProvider>
    </FirebaseClientContext.Provider>
  );
};

export const useFirebaseClient = (): FirebaseClientContextState => {
  const context = useContext(FirebaseClientContext);
  if (context === undefined) {
    throw new Error('useFirebaseClient must be used within a FirebaseClientProvider');
  }
  return context;
};
