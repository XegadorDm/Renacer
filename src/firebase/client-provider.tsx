'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  Firestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

let appInstance: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let firestoreInstance: Firestore | undefined;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    if (typeof window === 'undefined') {
      return { firebaseApp: null, auth: null, firestore: null };
    }

    try {
      if (!appInstance) {
        const apps = getApps();
        appInstance = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
      }
      
      if (!authInstance) {
        authInstance = getAuth(appInstance);
      }
      
      if (!firestoreInstance) {
        // REQ: Recuperar persistencia offline para trabajo en campo (Cauca)
        // Se usa la configuración más estable para evitar errores de aserción interna.
        firestoreInstance = initializeFirestore(appInstance, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
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

interface FirebaseClientProviderProps {
  children: ReactNode;
}
