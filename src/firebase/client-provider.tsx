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

/**
 * SINGLETONS DE MÓDULO:
 * Se mantienen fuera del componente para evitar re-inicializaciones durante HMR.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Evitar ejecución en el servidor
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    try {
      // 1. Inicializar App (una sola vez)
      if (!appInstance) {
        const apps = getApps();
        appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
      }
      
      // 2. Inicializar Auth
      if (!authInstance) {
        authInstance = getAuth(appInstance);
      }
      
      // 3. Obtener Firestore (SIN persistencia, SIN initializeFirestore personalizado)
      // Usamos getFirestore(app) directamente para asegurar que no hay configuración de caché local activa.
      if (!firestoreInstance) {
        firestoreInstance = getFirestore(appInstance);
      }
      
      return { 
        firebaseApp: appInstance, 
        auth: authInstance, 
        firestore: firestoreInstance 
      };
    } catch (error) {
      console.error("FirebaseClientProvider: Error durante la inicialización minimalista:", error);
      return { firebaseApp: null, auth: null, firestore: null };
    }
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
