import { prisma } from '@/lib/db'

interface AuditLogInput {
  organizationId?: string | null
  actorUserId: string
  action: string
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
}

/**
 * Append-only audit trail (docs/phase2/DATABASE_SCHEMA.md §7, AC US-61).
 * Call this from every mutating route — including ones performed by
 * yorkstn_staff on a client org, so the org's own owner/admin can always see
 * what staff did on their behalf (AUTH_RBAC.md §3).
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId ?? null,
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before === undefined ? undefined : (input.before as object),
      after: input.after === undefined ? undefined : (input.after as object),
    },
  })
}
