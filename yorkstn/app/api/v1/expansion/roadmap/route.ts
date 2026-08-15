import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { syncRoadmapMilestones } from '@/lib/modules/expansion/roadmap/milestone-auto-sync'

// GET /api/v1/expansion/roadmap — US-43. Syncs milestone status from real
// module state on every read (no background job runner exists yet).
export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:view')
  const roadmap = await syncRoadmapMilestones(ctx.organizationId)
  return NextResponse.json({ data: roadmap })
})
