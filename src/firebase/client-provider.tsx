'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
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
 * Utiliza un estado 'isReady' y useEffect para asegurar que los servicios
 * estén completamente inicializados antes de renderizar los componentes hijos,
 * evitando el error "INTERNAL ASSERTION FAILED (ca9)".
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // La inicialización debe ocurrir solo en el cliente
    if (typeof window !== 'undefined') {
      if (!appInstance) {
        const existingApps = getApps();
        appInstance = existingApps.length === 0 ? initializeApp(firebaseConfig) : getApp();
      }

      if (!authInstance) {
        authInstance = getAuth(appInstance);
      }

      if (!firestoreInstance) {
        try {
          // initializeFirestore es más estable para la primera llamada en entornos HMR.
          // Usamos una configuración mínima para evitar conflictos de caché.
          firestoreInstance = initializeFirestore(appInstance, {
            experimentalForceLongPolling: false,
          });
        } catch (e) {
          // Si ya estaba inicializado (por ejemplo, en un hot reload), recuperamos la instancia.
          firestoreInstance = getFirestore(appInstance);
        }
      }
      setIsReady(true);
    }
  }, []);

  // No renderizamos nada hasta que Firebase esté listo.
  // Esto evita que los hooks como useCollection se ejecuten prematuramente con una instancia inestable.
  if (!isReady || !appInstance || !authInstance || !firestoreInstance) {
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={appInstance}
      auth={authInstance}
      firestore={firestoreInstance}
    >
      {children}
    </FirebaseProvider>
  );
}
