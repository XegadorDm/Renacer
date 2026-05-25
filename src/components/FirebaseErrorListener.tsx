'use client';

import { useEffect } from 'react';

export function FirebaseErrorListener() {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = args[0]?.toString() || '';
      if (
        msg.includes('INTERNAL ASSERTION FAILED') ||
        msg.includes('ca9') ||
        msg.includes('FIRESTORE') ||
        msg.includes('permission-error')
      ) {
        return;
      }
      originalError.apply(console, args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);
  return null;
}