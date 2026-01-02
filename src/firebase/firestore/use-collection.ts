'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData, type FirestoreError } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { WithId, InternalQuery } from './types';


export const useCollection = <T extends DocumentData>(
  q: Query<T> | null
) => {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If the query is null (or undefined), it means we're not ready to fetch yet.
    // Set loading to true if we haven't loaded anything yet, or keep it as is if we have previous data.
    if (!q) {
      if (data === null) {
        setLoading(true);
      }
      return;
    };
    
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WithId<T>[];
        setData(documents);
        setLoading(false);
      },
      (err: FirestoreError) => {
        const path = (q as unknown as InternalQuery)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({ operation: 'list', path });
        
        setError(contextualError);
        setData(null);
        setLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [q, data]); // Added 'data' to dependency array to handle the initial loading state correctly

  return { data, loading, error };
};
