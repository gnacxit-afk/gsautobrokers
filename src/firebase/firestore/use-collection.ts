
'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Use a ref to track the previous query to prevent unnecessary loading states
  const prevQueryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (q === null) {
      setLoading(true);
      return;
    };
    
    // Using JSON.stringify on the query object provides a stable key for comparison.
    // This is safer than relying on internal, private properties like _query.
    const queryKey = JSON.stringify(q);
    
    // Only set loading to true if the query has actually changed.
    // This prevents re-renders from dialogs, etc., from causing a loading flash.
    if (prevQueryKeyRef.current !== queryKey) {
        setLoading(true);
        setData(null); // Clear previous data when query changes
        prevQueryKeyRef.current = queryKey;
    }

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
  }, [q]);

  return { data, loading, error, setData };
};
