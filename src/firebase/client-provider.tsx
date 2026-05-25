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

// Singletons fuera del componente para evitar re-inicialización por HMR
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

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
        // En Next.js 15/HMR, initializeFirestore puede fallar si ya existe una conexión persistente.
        // Solo intentamos inicializar con caché si no existe una instancia previa.
        firestoreInstance = initializeFirestore(appInstance, {
          localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager()
          })
        });
      } catch (e) {
        // Fallback seguro al singleton inteligente del SDK
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
