'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';

// This pattern ensures that Firebase is initialized only once.
function initializeFirebaseServices() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  return { app, auth, firestore };
}


export const { app, auth, firestore } = initializeFirebaseServices();

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
