import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { createProjection, listProjections } from '@/lib/modules/expansion/financial-projections/projection.service'

const lineItemSchema = z.object({
  label: z.string().min(1),
  amount: z.number(),
  sourceType: z.enum(['user_input', 'platform_benchmark']),
})

const createSchema = z.object({
  cityId: z.string().uuid().optional(),
  horizonMonths: z.number().int().positive(),
  lineItems: z.array(lineItemSchema),
})

export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:view')
  const projections = await listProjections(ctx.organizationId)
  return NextResponse.json({ data: projections })
})

// POST /api/v1/expansion/financial-projections — US-44, AC US-44.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:edit')

  const body = createSchema.parse(await req.json())
  const projection = await createProjection(ctx.organizationId, body)
  return NextResponse.json({ data: projection }, { status: 201 })
})
