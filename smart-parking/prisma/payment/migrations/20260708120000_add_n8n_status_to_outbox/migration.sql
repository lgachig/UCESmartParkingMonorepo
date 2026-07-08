-- AlterTable
ALTER TABLE "outbox_events"
  ADD COLUMN "n8n_status" TEXT,
  ADD COLUMN "n8n_error" TEXT,
  ADD COLUMN "n8n_retry_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "n8n_sent_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "outbox_events_n8n_status_idx" ON "outbox_events"("n8n_status");

