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
import type { WithId, InternalQuery } from './types';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(q: Query<DocumentData> | null) {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const prevQueryKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (q === null) {
      setData([]);
      setLoading(false);
      return;
    }

    const queryKey = JSON.stringify(q);

    if (prevQueryKeyRef.current === queryKey) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    prevQueryKeyRef.current = queryKey;
    
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
        const permissionError = new FirestorePermissionError({
          path: (q as InternalQuery)._query.path.canonicalString(),
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
