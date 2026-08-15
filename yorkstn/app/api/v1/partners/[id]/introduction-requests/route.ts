import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { createIntroductionRequest } from '@/lib/modules/partners/introductions/introduction-request.service'
import { writeAuditLog } from '@/lib/audit'

const bodySchema = z.object({ context: z.string().optional() })

// POST /api/v1/partners/:id/introduction-requests — US-33.
export const POST = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'partners:introduce')

    const { context } = bodySchema.parse(await req.json().catch(() => ({})))
    const request = await createIntroductionRequest(ctx.organizationId, params.id, ctx.userId, context)

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'introduction_request.created',
      entityType: 'introduction_request',
      entityId: request.id,
      after: { partnerId: params.id },
    })

    return NextResponse.json({ data: request }, { status: 201 })
  },
)
