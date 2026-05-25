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
 * Estas variables residen fuera del ciclo de vida de React.
 * En Next.js (Desarrollo), persisten durante el Hot Module Replacement (HMR),
 * lo que evita que intentemos inicializar Firestore más de una vez con 
 * configuraciones de persistencia conflictivas (causa del error ca9).
 */
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Evitar ejecución en el servidor (SSR)
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    // 1. Inicializar App (Patrón Idempotente)
    if (!appInstance) {
      const apps = getApps();
      appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }
    
    // 2. Inicializar Auth (Singleton)
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }
    
    // 3. Inicializar Firestore (Singleton Directo)
    // Usamos getFirestore() ya que es inteligente: si la app ya tiene una instancia
    // (incluso con persistencia habilitada previamente), la devuelve tal cual.
    // No usamos initializeFirestore aquí para evitar el error 'Unexpected state (ID: ca9)'
    // que ocurre al intentar re-configurar la base de datos local en desarrollo.
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
