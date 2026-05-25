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

/**
 * SINGLETONS GLOBALES:
 * Estas variables residen fuera de React para persistir durante HMR.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    // 1. Inicializar App
    if (!appInstance) {
      const apps = getApps();
      appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    
    // 2. Inicializar Auth
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }
    
    // 3. Inicializar Firestore con protección contra ca9
    if (!firestoreInstance) {
      try {
        // Solo habilitamos persistencia en producción para evitar colisiones en desarrollo
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
        // Si ya fue inicializado por otra parte del SDK, recuperamos la instancia existente
        firestoreInstance = getFirestore(appInstance);
      }
    }
    
    return { 
      firebaseApp: appInstance, 
      auth: authInstance, 
      firestore: firestoreInstance 
    };
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
