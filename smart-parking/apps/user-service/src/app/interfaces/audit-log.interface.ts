export interface UserAuditLogEntry {
  action: string;
  authUserId?: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}
