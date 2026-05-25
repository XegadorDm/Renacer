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

// Singletons globales para evitar re-inicialización por HMR en desarrollo
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Evitar ejecución en el servidor
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    // Inicializar App una sola vez
    if (!appInstance) {
      const apps = getApps();
      appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    
    // Inicializar Auth una sola vez
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }
    
    // Inicializar Firestore usando el singleton inteligente del SDK
    // Esto previene errores de "Unexpected state (ca9)" al no forzar persistencia manual en cada render
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
