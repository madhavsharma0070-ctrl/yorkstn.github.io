import { randomUUID } from 'crypto'
import { mkdir, writeFile, readFile } from 'fs/promises'
import path from 'path'

/**
 * Document storage behind a provider interface (DECISIONS.md D-20).
 * `local` is the dev-only default (writes under a gitignored
 * `.local-storage/` directory at the repo root); `s3` is documented but not
 * implemented until an S3 bucket + credentials are actually provisioned
 * (docs/phase2/DEPLOYMENT_ARCHITECTURE.md §8) — selecting it today throws a
 * clear configuration error rather than silently no-op-ing.
 */
export interface StorageAdapter {
  /** Persists a file, returning an opaque storageKey to store in Document.fileUrl. */
  save(input: { buffer: Buffer; fileName: string }): Promise<{ storageKey: string }>
  /** Reads a previously-saved file back out. */
  read(storageKey: string): Promise<Buffer>
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.local-storage')

class LocalStorageAdapter implements StorageAdapter {
  async save(input: { buffer: Buffer; fileName: string }): Promise<{ storageKey: string }> {
    await mkdir(LOCAL_STORAGE_DIR, { recursive: true })
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageKey = `${randomUUID()}-${safeName}`
    await writeFile(path.join(LOCAL_STORAGE_DIR, storageKey), input.buffer)
    return { storageKey }
  }

  async read(storageKey: string): Promise<Buffer> {
    // Reject path traversal — storageKey must never escape LOCAL_STORAGE_DIR.
    const safeKey = path.basename(storageKey)
    return readFile(path.join(LOCAL_STORAGE_DIR, safeKey))
  }
}

class S3StorageAdapter implements StorageAdapter {
  async save(): Promise<{ storageKey: string }> {
    throw new Error(
      'DOCUMENT_STORAGE_PROVIDER=s3 is configured but not yet implemented — an AWS S3 bucket ' +
        'and credentials have not been provisioned in this environment (see ' +
        'docs/phase2/DEPLOYMENT_ARCHITECTURE.md §8). Set DOCUMENT_STORAGE_PROVIDER=local for now.',
    )
  }

  async read(): Promise<Buffer> {
    throw new Error('DOCUMENT_STORAGE_PROVIDER=s3 is not yet implemented.')
  }
}

export function getStorageAdapter(): StorageAdapter {
  const provider = process.env.DOCUMENT_STORAGE_PROVIDER ?? 'local'
  if (provider === 's3') return new S3StorageAdapter()
  return new LocalStorageAdapter()
}
