import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { searchPartners } from '@/lib/modules/partners/directory/search.service'
import { partnerCategorySchema, partnerVerifStatusSchema } from '@/lib/validation/enums'

// GET /api/v1/partners — US-30, API_SPECIFICATION.md §5.
export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'partners:view')

  const params = req.nextUrl.searchParams
  const category = params.get('category')
  const cityId = params.get('cityId')
  const verificationStatus = params.get('verificationStatus')

  const partners = await searchPartners({
    category: category ? partnerCategorySchema.parse(category) : undefined,
    cityId: cityId ?? undefined,
    verificationStatus: verificationStatus ? partnerVerifStatusSchema.parse(verificationStatus) : undefined,
  })

  return NextResponse.json({ data: partners })
})
