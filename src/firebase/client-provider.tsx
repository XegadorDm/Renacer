'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Variables globales para asegurar un único Singleton fuera del ciclo de vida de React
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // 1. Inicializar App
    if (!appInstance) {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        appInstance = existingApps[0];
      } else {
        appInstance = initializeApp(firebaseConfig);
      }
    }

    // 2. Inicializar Auth
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }

    // 3. Inicializar Firestore de forma segura
    if (!firestoreInstance) {
      firestoreInstance = getFirestore(appInstance);
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
