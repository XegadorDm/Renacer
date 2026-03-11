export type CaseStatus = 
  | "Sin novedad" 
  | "Respuesta de gobierno en curso" 
  | "Proceso finalizado con exito"
  | "Usuario contactado por llamada";

export interface Case {
    id: string;
    caseNumber: string;
    firstName: string;
    lastName: string;
    documentId: string;
    internalId?: string;
    ethnicGroup: string;
    maritalStatus: string;
    gender: string;
    birthDate: string;
    address: string;
    municipality: string;
    department: string;
    phone1: string;
    phone2?: string;
    displacementType: string;
    disability: string;
    age: number;
    isElderly: boolean;
    householdMembers: number;
    testimony: string;
    status: CaseStatus;
    members: { [uid: string]: 'owner' | 'editor' | 'viewer' };
}
