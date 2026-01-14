'use client';

// This file serves as a barrel file for easy access to Firebase hooks and providers.

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';

// Note: We no longer initialize Firebase services here to prevent server/client conflicts.
// Initialization is handled within FirebaseClientProvider.
