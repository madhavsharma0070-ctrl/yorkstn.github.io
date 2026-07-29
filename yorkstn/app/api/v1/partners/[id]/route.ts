import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { getPartnerProfileForBrand } from '@/lib/modules/partners/directory/profile.service'

// GET /api/v1/partners/:id — US-31. Never includes rejectionReason or
// internal verification history (getPartnerProfileForBrand's allow-list).
export const GET = withApiErrorHandling(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'partners:view')

    const partner = await getPartnerProfileForBrand(params.id)
    return NextResponse.json({ data: partner })
  },
)
