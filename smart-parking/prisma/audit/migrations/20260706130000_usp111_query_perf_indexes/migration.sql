-- USP-111: optimize for the admin panel's most common queries (by source
-- service, by user, by date range) so they stay fast with a large
-- accumulated history.

-- DropIndex
DROP INDEX IF EXISTS "audit_records_source_service_idx";

-- CreateIndex
CREATE INDEX "audit_records_source_service_created_at_idx" ON "audit_records"("source_service", "created_at");

-- CreateIndex
CREATE INDEX "audit_records_user_id_created_at_idx" ON "audit_records"("user_id", "created_at");