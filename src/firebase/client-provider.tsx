'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, but only once.
    if (!getApps().length) {
      const app = initializeApp(firebaseConfig);
      const firestoreInstance = getFirestore(app);

      // IMPORTANT: Enable persistence right after initialization and before any other Firestore operations.
      // This allows the app to work offline.
      if (typeof window !== 'undefined') {
        enableIndexedDbPersistence(firestoreInstance).catch((err) => {
          if (err.code == 'failed-precondition') {
            console.warn(
              'Firestore persistence failed to enable. This is likely due to multiple tabs being open.'
            );
          } else if (err.code == 'unimplemented') {
            console.warn(
              'Firestore persistence is not supported in this browser.'
            );
          }
        });
      }

      return {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: firestoreInstance,
      };
    }
    
    // If already initialized, just get the instances.
    const app = getApp();
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
