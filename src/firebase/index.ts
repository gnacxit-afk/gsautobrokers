'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore } {
  if (getApps().length === 0) {
    const firebaseApp = initializeApp(firebaseConfig);
    const auth = getAuth(firebaseApp);
    const firestore = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    });
    return { firebaseApp, auth, firestore };
  } 
  
  const app = getApp();
  return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';