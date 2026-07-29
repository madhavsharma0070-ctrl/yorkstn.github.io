import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getCityIntelligence } from '@/lib/modules/expansion/content/city-intelligence.service'

// GET /api/v1/expansion/cities/:cityId — US-40.
export const GET = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { cityId: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'expansion:view')
    const city = await getCityIntelligence(params.cityId)
    return NextResponse.json({ data: city })
  },
)
