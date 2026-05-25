'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../provider';

export type WithId<T> = T & { id: string; _hasPendingWrites?: boolean };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * useCollection
 * Hook ultra-estabilizado para evitar error ca9.
 * Se asegura de cerrar listeners previos antes de abrir nuevos.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    let isMounted = true;

    if (!memoizedTargetRefOrQuery || isUserLoading || !user) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    // Suscripción pura sin metadatos para evitar conflicto ca9
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!isMounted) return;
        
        const results: WithId<T>[] = snapshot.docs.map(doc => ({ 
          ...(doc.data() as T), 
          id: doc.id,
          _hasPendingWrites: snapshot.metadata.hasPendingWrites
        }));
        
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (serverError: FirestoreError) => {
        if (!isMounted) return;

        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query?.path?.canonicalString() || 'unknown';

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [memoizedTargetRefOrQuery, user, isUserLoading]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Firestore reference must be memoized with useMemoFirebase');
  }

  return { data, isLoading, error };
}
