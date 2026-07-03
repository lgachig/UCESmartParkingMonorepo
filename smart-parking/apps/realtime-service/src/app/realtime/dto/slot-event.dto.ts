export interface SlotEventPayload {
    eventType: string;
    id: string;
    number?: number;
    status?: string;
    previousStatus?: string;
    zoneId?: number;
    facultyId?: number;
    timestamp: string;
}