import { createHash } from 'crypto'
import { prisma } from '@/lib/db'
import { getStorageAdapter } from './storage.adapter'
import type { AttachedToType } from '@/lib/validation/enums'

/**
 * Document Management (US-25, AC US-25): "previous versions remain
 * retrievable, not overwritten." Uploading to an existing document creates a
 * new DocumentVersion row (never mutates or deletes a prior one, per
 * DATABASE_SCHEMA.md §1.4's append-only retention rule).
 */

export interface UploadDocumentInput {
  organizationId: string
  attachedToType: AttachedToType
  attachedToId: string
  documentType: string
  title: string
  createdByUserId: string
  file: { buffer: Buffer; fileName: string; mimeType: string }
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25MB, per SECURITY_ARCHITECTURE.md upload policy
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
])

export class UnsupportedFileError extends Error {}

function assertFileIsAllowed(file: { buffer: Buffer; mimeType: string }) {
  if (file.buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new UnsupportedFileError(`File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit.`)
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    throw new UnsupportedFileError(`File type ${file.mimeType} is not supported. Allowed: PDF, DOCX, PNG, JPG.`)
  }
}

/** Creates a brand-new document (its first version). */
export async function uploadNewDocument(input: UploadDocumentInput) {
  assertFileIsAllowed(input.file)
  const storage = getStorageAdapter()
  const { storageKey } = await storage.save(input.file)
  const checksum = createHash('sha256').update(input.file.buffer).digest('hex')

  return prisma.document.create({
    data: {
      organizationId: input.organizationId,
      attachedToType: input.attachedToType,
      attachedToId: input.attachedToId,
      documentType: input.documentType,
      title: input.title,
      createdByUserId: input.createdByUserId,
      versions: {
        create: {
          versionNumber: 1,
          storageKey,
          fileName: input.file.fileName,
          mimeType: input.file.mimeType,
          sizeBytes: input.file.buffer.byteLength,
          checksum,
          uploadedByUserId: input.createdByUserId,
        },
      },
    },
    include: { versions: true },
  })
}

/** Adds a new version to an existing document — never overwrites version 1..N-1. */
export async function addDocumentVersion(
  documentId: string,
  uploadedByUserId: string,
  file: { buffer: Buffer; fileName: string; mimeType: string },
) {
  assertFileIsAllowed(file)
  const storage = getStorageAdapter()
  const { storageKey } = await storage.save(file)
  const checksum = createHash('sha256').update(file.buffer).digest('hex')

  const latest = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { versionNumber: 'desc' },
  })
  const nextVersionNumber = (latest?.versionNumber ?? 0) + 1

  return prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersionNumber,
      storageKey,
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.buffer.byteLength,
      checksum,
      uploadedByUserId,
    },
  })
}

export async function getDocumentWithVersions(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { versionNumber: 'desc' } } },
  })
}

export async function listDocumentsFor(attachedToType: AttachedToType, attachedToId: string) {
  return prisma.document.findMany({
    where: { attachedToType, attachedToId, deletedAt: null },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  })
}
