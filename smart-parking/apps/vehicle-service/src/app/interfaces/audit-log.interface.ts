export interface VehicleAuditLogEntry {
  action: string;
  authUserId?: string;
  vehicleId?: string;
  metadata?: Record<string, unknown>;
}
