'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../provider';

type WithId<T> = T & { id: string; _hasPendingWrites?: boolean };

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

/**
 * useDoc
 * Hook estabilizado para evitar errores ca9 en Firestore.
 * includeMetadataChanges: false garantiza la estabilidad del Watch stream.
 */
export function useDoc<T = any>(
  memoizedDocRef: (DocumentReference<DocumentData> & {__memo?: boolean}) | null | undefined,
): UseDocResult<T> {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    let isMounted = true;

    if (!memoizedDocRef || isUserLoading || !user) {
      if (isMounted) {
        setData(null);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      { includeMetadataChanges: false },
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (!isMounted) return;
        
        if (snapshot.exists()) {
          setData({ 
              ...(snapshot.data() as T), 
              id: snapshot.id,
              _hasPendingWrites: snapshot.metadata.hasPendingWrites 
          });
        } else {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      },
      (serverError: FirestoreError) => {
        if (!isMounted) return;

        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
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
  }, [memoizedDocRef, user, isUserLoading]);

  if(memoizedDocRef && !memoizedDocRef.__memo) {
    throw new Error('Firestore reference must be memoized with useMemoFirebase');
  }

  return { data, isLoading, error };
}
