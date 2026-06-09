export type CaseStatus = "Sin novedad" | "CONTACTADO" | "NO CONTACTADO";
export type UserStatus = "pending" | "approved" | "rejected";
export type SyncStatus = "synced" | "pending" | "error";

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
    userId: string;
    createdAt: any; 
    members: { [uid: string]: 'owner' | 'editor' | 'viewer' };
    
    // Capa de Recuperación de Sincronización (REQ-006)
    syncStatus?: SyncStatus;
    syncAttempts?: number;
    lastSyncError?: string;
    lastSyncAt?: any;
    syncError?: boolean; // Retrocompatibilidad visual
}

export interface PublicCaseStatus {
    documentId: string;
    caseNumber: string;
    firstName: string;
    lastName: string;
    status: CaseStatus;
    municipality: string;
    createdAt: any;
    updatedAt: any;
}

export interface PublicCaseQuery {
    documentId: string;
    caseNumber: string | null;
    statusAtQuery: string | null;
    consultedAt: any;
    result: 'found' | 'not_found';
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
