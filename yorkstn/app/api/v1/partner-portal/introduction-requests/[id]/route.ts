import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePartnerContext } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { updateIntroductionRequestStatus } from '@/lib/modules/partners/introductions/introduction-request.service'

const bodySchema = z.object({ status: z.enum(['partner_viewed', 'accepted', 'declined']) })

// PATCH /api/v1/partner-portal/introduction-requests/:id — US-33 (partner side).
export const PATCH = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requirePartnerContext()
    const { status } = bodySchema.parse(await req.json())
    const updated = await updateIntroductionRequestStatus(ctx.partnerId, params.id, status)
    return NextResponse.json({ data: updated })
  },
)
