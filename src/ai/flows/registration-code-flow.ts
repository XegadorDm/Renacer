
'use server';
/**
 * @fileOverview Flujo para la generación y envío de códigos de seguridad, validando contra la lista de autorizados.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Inicializamos Firebase para uso en el servidor si no está inicializado
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

const RegistrationCodeInputSchema = z.object({
  email: z.string().email().describe('El correo electrónico del usuario que solicita el registro.'),
});

const RegistrationCodeOutputSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  message: z.string(),
  isAuthorized: z.boolean(),
});

export async function requestRegistrationCode(input: { email: string }) {
  return registrationCodeFlow(input);
}

const registrationCodeFlow = ai.defineFlow(
  {
    name: 'registrationCodeFlow',
    inputSchema: RegistrationCodeInputSchema,
    outputSchema: RegistrationCodeOutputSchema,
  },
  async (input) => {
    const emailLower = input.email.toLowerCase();

    // 1. Verificar si el correo está en la lista de autorizados
    const authEmailsRef = collection(db, 'authorized_emails');
    const q = query(authEmailsRef, where("email", "==", emailLower));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        message: 'Lo sentimos, este correo electrónico no está autorizado para el registro. Contacte con el administrador.',
        isAuthorized: false,
      };
    }

    // 2. Generar código de 6 dígitos
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Simulación de envío (imprimir en consola para el prototipo)
    console.log(`[RENACER] Código enviado a ${emailLower}: ${generatedCode}`);

    return {
      success: true,
      code: generatedCode,
      message: `Código enviado exitosamente a ${emailLower}. Revise su bandeja de entrada.`,
      isAuthorized: true,
    };
  }
);
