
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore,
  Firestore 
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// Singletons definidos fuera del ciclo de vida del componente para persistir entre re-renders y HMR
let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

/**
 * Proveedor de Firebase para el cliente.
 * Utiliza getFirestore() para evitar el error "INTERNAL ASSERTION FAILED (ca9)"
 * garantizando una recuperación segura de la instancia de base de datos.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // 1. Inicializar la App de Firebase (Idempotente)
    if (!appInstance) {
      const existingApps = getApps();
      appInstance = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    }

    // 2. Inicializar el servicio de Autenticación
    if (!authInstance) {
      authInstance = getAuth(appInstance);
    }

    // 3. Inicializar Firestore de forma segura
    // getFirestore() es preferible sobre initializeFirestore() en entornos con HMR
    // ya que no intenta re-configurar el caché si ya está activo.
    if (!firestoreInstance) {
      firestoreInstance = getFirestore(appInstance);
    }

    return {
      firebaseApp: appInstance,
      auth: authInstance,
      firestore: firestoreInstance,
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
