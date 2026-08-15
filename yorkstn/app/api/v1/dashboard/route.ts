import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getDashboardSummary } from '@/lib/modules/expansion/dashboard-aggregation.service'

// GET /api/v1/dashboard — US-46. A single composed endpoint (not four
// client-side fan-out calls) per API_SPECIFICATION.md §6. Available to any
// org role (each underlying read is itself role-appropriate; there is no
// edit action here to gate).
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  const summary = await getDashboardSummary(ctx.organizationId)
  return NextResponse.json({ data: summary })
})
