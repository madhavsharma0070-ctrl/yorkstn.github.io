/*
  Warnings:

  - You are about to drop the column `assignedStaffId` on the `managed_service_engagements` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `managed_service_engagements` table. All the data in the column will be lost.
  - Added the required column `requestedByUserId` to the `managed_service_engagements` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "managed_service_updates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "engagementId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "statusAtTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "managed_service_updates_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "managed_service_engagements" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "managed_service_updates_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_managed_service_engagements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "linkedComplianceItemId" TEXT,
    "scope" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "assignedStaffUserId" TEXT,
    "deliverableUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "managed_service_engagements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "managed_service_engagements_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "managed_service_engagements_assignedStaffUserId_fkey" FOREIGN KEY ("assignedStaffUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "managed_service_engagements_linkedComplianceItemId_fkey" FOREIGN KEY ("linkedComplianceItemId") REFERENCES "compliance_workflow_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_managed_service_engagements" ("createdAt", "id", "linkedComplianceItemId", "organizationId", "scope", "status", "updatedAt") SELECT "createdAt", "id", "linkedComplianceItemId", "organizationId", "scope", "status", "updatedAt" FROM "managed_service_engagements";
DROP TABLE "managed_service_engagements";
ALTER TABLE "new_managed_service_engagements" RENAME TO "managed_service_engagements";
CREATE INDEX "managed_service_engagements_organizationId_idx" ON "managed_service_engagements"("organizationId");
CREATE INDEX "managed_service_engagements_assignedStaffUserId_idx" ON "managed_service_engagements"("assignedStaffUserId");
CREATE INDEX "managed_service_engagements_status_idx" ON "managed_service_engagements"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "managed_service_updates_engagementId_createdAt_idx" ON "managed_service_updates"("engagementId", "createdAt");
