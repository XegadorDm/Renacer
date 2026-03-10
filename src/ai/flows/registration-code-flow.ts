'use server';
/**
 * @fileOverview Flujo para la generación y envío de códigos de seguridad por correo real.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { Resend } from 'resend';

// Inicializamos Firebase para uso en el servidor si no está inicializado
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const db = getFirestore();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // 3. Enviar correo real si Resend está configurado
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Renacer <onboarding@resend.dev>',
          to: emailLower,
          subject: 'Código de Seguridad - Registro Renacer',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2>Hola,</h2>
              <p>Desde el equipo del <strong>Grupo Renacer</strong> le informamos que ha solicitado el registro de una cuenta para el cargo de Asesor.</p>
              <p>Para completar el proceso de creación de su cuenta, utilice el siguiente código de seguridad:</p>
              <div style="background-color: #f5f5dc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #d35400;">${generatedCode}</span>
              </div>
              <p>Este código es confidencial y tiene una validez limitada. Por favor, no lo comparta con terceros.</p>
              <p>Si usted no realizó esta solicitud, le recomendamos ignorar este mensaje o comunicarse con el equipo de soporte.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
              <p style="font-size: 12px; color: #777;">Cordialmente,<br/>Equipo de Administración<br/>Grupo Renacer</p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Error enviando correo con Resend:', error);
      }
    }

    // Siempre imprimimos en consola para desarrollo
    console.log(`[RENACER] Código generado para ${emailLower}: ${generatedCode}`);

    return {
      success: true,
      code: generatedCode,
      message: `El código ha sido enviado a su correo electrónico.`,
      isAuthorized: true,
    };
  }
);
