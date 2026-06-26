/*
  Warnings:

  - You are about to drop the column `createdAt` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `slot_id` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the `faculties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `slots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `zones` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "slots" DROP CONSTRAINT "slots_faculty_id_fkey";

-- DropForeignKey
ALTER TABLE "slots" DROP CONSTRAINT "slots_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "zones" DROP CONSTRAINT "zones_faculty_id_fkey";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "createdAt",
DROP COLUMN "slot_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reservation_id" TEXT;

-- DropTable
DROP TABLE "faculties";

-- DropTable
DROP TABLE "slots";

-- DropTable
DROP TABLE "zones";

-- DropEnum
DROP TYPE "SlotStatus";

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "reservation_code" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_reservation_code_key" ON "reservations"("reservation_code");

-- CreateIndex
CREATE INDEX "reservations_user_id_idx" ON "reservations"("user_id");

-- CreateIndex
CREATE INDEX "reservations_slot_id_idx" ON "reservations"("slot_id");

-- CreateIndex
CREATE INDEX "reservations_vehicle_id_idx" ON "reservations"("vehicle_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");
