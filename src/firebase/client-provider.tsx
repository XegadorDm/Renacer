'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de Firebase simplificado al máximo.
 * Se elimina toda la persistencia offline para asegurar que las reglas de seguridad 
 * se sincronicen en tiempo real con el servidor y no usen caché antigua.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Inicialización estándar
    const existingApps = getApps();
    const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Obtenemos Firestore sin configuraciones offline adicionales
    const firestore = getFirestore(app);

    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: firestore,
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