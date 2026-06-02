export interface AuditLogEntry {
  action: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
