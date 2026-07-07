-- CreateTable
CREATE TABLE "audit_records" (
    "id" TEXT NOT NULL,
    "source_service" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "previous_value" JSONB,
    "new_value" JSONB,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_records_source_service_idx" ON "audit_records"("source_service");

-- CreateIndex
CREATE INDEX "audit_records_action_idx" ON "audit_records"("action");

-- CreateIndex
CREATE INDEX "audit_records_created_at_idx" ON "audit_records"("created_at");

-- USP-109: immutability must be guaranteed by design, not only by permissions.
-- Even if a future bug in the app (or a manual psql session) tries to UPDATE
-- or DELETE a row, the database itself refuses it.
CREATE OR REPLACE FUNCTION prevent_audit_records_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_records is insert-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_records_no_update
BEFORE UPDATE ON "audit_records"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_records_mutation();

CREATE TRIGGER audit_records_no_delete
BEFORE DELETE ON "audit_records"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_records_mutation();
