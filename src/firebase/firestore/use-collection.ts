'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';

export const useCollection = <T extends DocumentData>(
  q: Query<T>
) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only subscribe if the query object is valid.
    if (!q) return;
    
    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(documents);
        setLoading(false);
      },
      (err) => {
        console.error("useCollection error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // The dependency array now correctly includes `q` stringified to re-run when the query changes.
  }, [q ? q.path : null, q ? JSON.stringify(q.where) : null]);

  return { data, loading, error };
};
