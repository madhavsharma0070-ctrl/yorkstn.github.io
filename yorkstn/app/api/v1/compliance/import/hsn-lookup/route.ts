import { NextRequest, NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling, ApiError } from '@/lib/http/errors'
import { lookupHsnCompliance } from '@/lib/modules/compliance/import/hsn-lookup.service'

// GET /api/v1/compliance/import/hsn-lookup?code= — API_SPECIFICATION.md §4,
// Category (b) curated lookup (never an AI call — see AI_ARCHITECTURE.md).
export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'compliance:view')

  const code = req.nextUrl.searchParams.get('code')
  if (!code) throw new ApiError('VALIDATION_ERROR', 422, 'A `code` query parameter is required.')

  return NextResponse.json({ data: lookupHsnCompliance(code) })
})
