
export interface Mensaje {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  asunto: string;
  mensaje: string;
  createdAt: string;
  read: boolean; // Indica si el mensaje ha sido visto por un asesor
  resolved?: boolean; // Indica si el caso del mensaje ya fue atendido
  linkedCase?: {
    id: string;
    caseNumber: string;
  };
}
