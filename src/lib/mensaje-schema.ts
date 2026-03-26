
export interface Mensaje {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  asunto: string;
  mensaje: string;
  createdAt: string;
  linkedCase?: {
    id: string;
    caseNumber: string;
  };
}
