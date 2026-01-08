
'use client';
import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot,
  query,
  collection,
  orderBy,
  where,
  limit,
  startAfter,
  endBefore,
  Query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import type { WithId } from './types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(q: Query<DocumentData> | null) {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to store the stringified version of the query.
  // This helps prevent re-subscribing if the query object instance changes
  // but the actual query details (path, filters) are the same.
  const queryKey = q ? JSON.stringify(q) : null;

  useEffect(() => {
    if (queryKey === null || !q) {
      setData([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => {
          return { id: doc.id, ...doc.data() } as WithId<T>;
        });
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        const path = (q as any)._query?.path?.canonicalString() || 'unknown path';
        const permissionError = new FirestorePermissionError({
          path: path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // The effect should ONLY re-run if the stringified query key changes.
  }, [queryKey]);

  return { data, loading, error };
}
