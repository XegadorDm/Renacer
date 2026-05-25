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

// Variables globales fuera del ciclo de React para evitar el error ca9
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // En el servidor devolvemos null
    if (typeof window === 'undefined') return null;

    if (!appInstance) {
      const existingApps = getApps();
      appInstance = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
    }

    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }

    if (!firestoreInstance) {
      firestoreInstance = getFirestore(appInstance);
    }

    return { 
      firebaseApp: appInstance, 
      auth: authInstance, 
      firestore: firestoreInstance 
    };
  }, []);

  // Siempre envolvemos en el proveedor para evitar errores de contexto en SSR
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices?.firebaseApp || null}
      auth={firebaseServices?.auth || null}
      firestore={firebaseServices?.firestore || null}
    >
      {children}
    </FirebaseProvider>
  );
}
