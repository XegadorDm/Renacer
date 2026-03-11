
export interface Notification {
    id: string;
    userId: string;
    caseId: string;
    message: string;
    status: string;
    createdAt: string;
    read: boolean;
}
