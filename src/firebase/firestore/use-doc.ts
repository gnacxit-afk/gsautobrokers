
'use client';
import { useState, useEffect, useRef } from 'react';
import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import type { WithId } from './types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use the document path as the key to prevent re-subscribing when the
  // ref object instance changes but the path is the same.
  const docPath = ref ? ref.path : null;

  useEffect(() => {
    if (docPath === null || !ref) {
      setData(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as WithId<T>);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(err);
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // The effect should ONLY re-run if the document path changes.
  }, [docPath, ref]);

  return { data, loading, error };
}
