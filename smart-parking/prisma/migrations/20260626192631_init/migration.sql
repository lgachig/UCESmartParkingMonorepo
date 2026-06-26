/*
  Warnings:

  - You are about to drop the column `profileId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the `user_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "profileId",
ADD COLUMN     "vehicleId" TEXT;

-- DropTable
DROP TABLE "user_profiles";

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_authUserId_key" ON "vehicles"("authUserId");
