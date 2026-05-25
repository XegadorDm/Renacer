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
 * SINGLETONS GLOBALES DE MÓDULO:
 * Se mantienen fuera del componente para garantizar que NUNCA se re-inicialicen
 * durante el Hot Module Replacement (HMR) de Next.js, eliminando el error ca9.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    try {
      // 1. Inicializar App una sola vez de forma atómica
      if (!appInstance) {
        const apps = getApps();
        appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
      }
      
      // 2. Inicializar Auth de forma única
      if (!authInstance) {
        authInstance = getAuth(appInstance);
      }
      
      // 3. Obtener Firestore de forma única y estable
      // Se utiliza getFirestore directamente para evitar conflictos de persistencia en desarrollo
      if (!firestoreInstance) {
        firestoreInstance = getFirestore(appInstance);
      }
      
      return { 
        firebaseApp: appInstance, 
        auth: authInstance, 
        firestore: firestoreInstance 
      };
    } catch (error) {
      console.error("FirebaseClientProvider Error:", error);
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
