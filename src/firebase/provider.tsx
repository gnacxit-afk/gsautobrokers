'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { initializeFirebase } from '@/firebase';

interface FirebaseProviderProps {
  children: ReactNode;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  const [services, setServices] = useState<{ firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore } | null>(null);
  const [userAuthState, setUserAuthState] = useState<{ user: User | null, isUserLoading: boolean, userError: Error | null }>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    const { firebaseApp, auth, firestore } = initializeFirebase();
    setServices({ firebaseApp, auth, firestore });

    const unsubscribe = onAuthStateChanged(auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp: services?.firebaseApp || null,
    firestore: services?.firestore || null,
    auth: services?.auth || null,
    ...userAuthState,
  }), [services, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


function useFirebaseInternal() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
}


/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth | null => {
  return useFirebaseInternal().auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore | null => {
  return useFirebaseInternal().firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp | null => {
  return useFirebaseInternal().firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 */
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebaseInternal();
  return { user, isUserLoading, userError };
};