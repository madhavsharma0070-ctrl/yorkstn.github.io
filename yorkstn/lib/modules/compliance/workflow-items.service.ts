import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/http/errors'

/** Loads a ComplianceWorkflowItem and verifies it belongs to the caller's active organization (tenant isolation, DECISIONS.md D-14). */
export async function loadOwnedWorkflowItem(organizationId: string, workflowItemId: string) {
  const item = await prisma.complianceWorkflowItem.findUnique({
    where: { id: workflowItemId },
    include: { complianceCase: true },
  })
  if (!item || item.complianceCase.organizationId !== organizationId) {
    throw new NotFoundError('Compliance workflow item not found.')
  }
  return item
}
