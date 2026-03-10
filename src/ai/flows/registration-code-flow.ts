'use server';
/**
 * @fileOverview Flujo para la generación y envío simulado de códigos de seguridad de registro.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RegistrationCodeInputSchema = z.object({
  email: z.string().email().describe('El correo electrónico del usuario que solicita el registro.'),
});

const RegistrationCodeOutputSchema = z.object({
  success: z.boolean(),
  code: z.string().describe('El código de seguridad generado.'),
  message: z.string().describe('Mensaje de confirmación del envío.'),
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
    // Generamos un código aleatorio de 6 dígitos
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    // En una aplicación de producción, aquí se llamaría a un servicio de correo (como Resend o SendGrid)
    // Para este prototipo, simulamos el envío y devolvemos el código para validación en el cliente.
    
    const emailBody = `
      Hola,

      Desde el equipo del Grupo Renacer le informamos que ha solicitado el registro de una cuenta para el cargo de Asesor.

      Para completar el proceso de creación de su cuenta, utilice el siguiente código de seguridad:

      Código: [${generatedCode}]

      Este código es confidencial y tiene una validez limitada. Por favor, no lo comparta con terceros.

      Si usted no realizó esta solicitud, le recomendamos ignorar este mensaje o comunicarse con el equipo de soporte.

      Cordialmente,
      Equipo de Administración
      Grupo Renacer
    `;

    // Retornamos el éxito y el código (el cliente lo recibirá para poder compararlo)
    return {
      success: true,
      code: generatedCode,
      message: `Código enviado exitosamente a ${input.email}`,
    };
  }
);
