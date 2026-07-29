import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listIntroductionRequestsForOrg } from '@/lib/modules/partners/introductions/introduction-request.service'

// GET /api/v1/partners/introduction-requests — the org's sent requests.
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'partners:view')
  const requests = await listIntroductionRequestsForOrg(ctx.organizationId)
  return NextResponse.json({ data: requests })
})
