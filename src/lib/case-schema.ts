
export type CaseStatus = "Sin novedad" | "CONTACTADO" | "NO CONTACTADO";
export type UserStatus = "pending" | "approved" | "rejected";

export interface Case {
    id: string;
    caseNumber: string;
    firstName: string;
    lastName: string;
    documentId: string; // Cédula tal como se ingresa
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
    userId: string;
    createdAt: any; 
    members: { [uid: string]: 'owner' | 'editor' | 'viewer' };
}

export interface PublicCaseStatus {
    documentId: string; // Cédula normalizada (solo números)
    caseNumber: string;
    status: CaseStatus;
    municipality: string;
    createdAt: any;
    updatedAt: any;
}

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'admin' | 'case-worker';
    status: UserStatus;
    createdAt: string;
    documentType?: string;
    documentNumber?: string;
    gender?: string;
}

export interface Novedad {
    id?: string;
    mensaje: string;
    tipo: 'llamada' | 'nota' | 'sistema';
    createdAt: any;
    createdBy: string;
}
