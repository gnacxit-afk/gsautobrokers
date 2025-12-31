'use client';
import {
  initializeApp,
  getApp,
  getApps,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './config';

// Re-export hooks and providers
export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes and returns the Firebase app, auth, and firestore instances.
 * It ensures that Firebase is initialized only once.
 *
 * @param {FirebaseOptions} [config] - Optional Firebase config.
 * @returns {{ firebaseApp: FirebaseApp, auth: Auth, firestore: Firestore }}
 */
export function initializeFirebase(config: FirebaseOptions = firebaseConfig) {
  if (!getApps().length) {
    firebaseApp = initializeApp(config);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApp();
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  return { firebaseApp, auth, firestore };
}
