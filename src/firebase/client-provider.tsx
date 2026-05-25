'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

let appInstance: FirebaseApp;
let authInstance: Auth;
let firestoreInstance: Firestore;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    if (!appInstance) {
      const existingApps = getApps();
      appInstance = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }
    if (!firestoreInstance) {
      try {
        // En producción usamos persistencia avanzada, en desarrollo getFirestore básico para evitar ca9
        if (process.env.NODE_ENV === 'production') {
          firestoreInstance = initializeFirestore(appInstance, {
            localCache: persistentLocalCache({
              tabManager: persistentSingleTabManager()
            })
          });
        } else {
          firestoreInstance = getFirestore(appInstance);
        }
      } catch (e) {
        // Fallback si initializeFirestore falla (ej: ya inicializado)
        firestoreInstance = getFirestore(appInstance);
      }
    }
    return { firebaseApp: appInstance, auth: authInstance, firestore: firestoreInstance };
  }, []);

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
