/*
  Warnings:

  - You are about to drop the column `createdAt` on the `document_versions` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `document_versions` table. All the data in the column will be lost.
  - You are about to drop the column `documentGroupId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedByUserId` on the `documents` table. All the data in the column will be lost.
  - Added the required column `storageKey` to the `document_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploadedByUserId` to the `document_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByUserId` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_document_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "document_versions_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_document_versions" ("documentId", "fileName", "id", "mimeType", "sizeBytes", "versionNumber") SELECT "documentId", "fileName", "id", "mimeType", "sizeBytes", "versionNumber" FROM "document_versions";
DROP TABLE "document_versions";
ALTER TABLE "new_document_versions" RENAME TO "document_versions";
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");
CREATE UNIQUE INDEX "document_versions_documentId_versionNumber_key" ON "document_versions"("documentId", "versionNumber");
CREATE TABLE "new_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "attachedToType" TEXT NOT NULL,
    "attachedToId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "documents_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_documents" ("attachedToId", "attachedToType", "createdAt", "documentType", "id", "organizationId") SELECT "attachedToId", "attachedToType", "createdAt", "documentType", "id", "organizationId" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
CREATE INDEX "documents_attachedToType_attachedToId_idx" ON "documents"("attachedToType", "attachedToId");
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
