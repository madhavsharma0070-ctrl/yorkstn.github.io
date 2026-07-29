import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getMallIntelligence } from '@/lib/modules/expansion/content/mall-intelligence.service'

// GET /api/v1/expansion/malls/:mallId — US-41.
export const GET = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { mallId: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'expansion:view')
    const mall = await getMallIntelligence(params.mallId)
    return NextResponse.json({ data: mall })
  },
)
