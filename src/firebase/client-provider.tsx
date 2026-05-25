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
 * SINGLETONS GLOBALES:
 * Se mantienen fuera del componente para garantizar que NO se re-inicialicen
 * durante el Hot Module Replacement (HMR) de Next.js, evitando el error ca9.
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    // 1. Inicializar App una sola vez
    if (!appInstance) {
      const apps = getApps();
      appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    
    // 2. Inicializar Auth una sola vez
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }
    
    // 3. Obtener Firestore de forma estable
    // getFirestore es idempotente y recupera la instancia existente si ya fue creada
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
