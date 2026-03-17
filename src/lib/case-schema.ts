export type CaseStatus = "Sin novedad";

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
    userId: string; // ID del usuario asociado al caso
    members: { [uid: string]: 'owner' | 'editor' | 'viewer' };
}

export interface Novedad {
    id?: string;
    mensaje: string;
    tipo: 'llamada' | 'nota' | 'sistema';
    createdAt: any;
    createdBy: string;
}
