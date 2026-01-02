'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData, type FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { WithId } from './types';

export const useDoc = <T extends DocumentData>(
  ref: DocumentReference<T> | null
) => {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the ref is null, we are not ready to fetch.
    // Set loading to true if there's no data yet.
    if (!ref) {
      if (data === null) {
          setLoading(true);
      }
      return;
    };
    
    setLoading(true);
    setError(null);
    const unsubscribe = onSnapshot(
      ref,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          setData({ id: docSnapshot.id, ...docSnapshot.data() } as WithId<T>);
        } else {
          setData(null); // Document does not exist
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({ operation: 'get', path: ref.path });
        setError(contextualError);
        setData(null);
        setLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [ref, data]); // Added 'data' to dependency array

  return { data, loading, error };
};
