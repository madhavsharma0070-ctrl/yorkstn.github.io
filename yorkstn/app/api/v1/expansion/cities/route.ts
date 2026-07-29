import { NextResponse } from 'next/server'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listCities } from '@/lib/modules/expansion/content/city-intelligence.service'

export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:view')
  const cities = await listCities()
  return NextResponse.json({ data: cities })
})
