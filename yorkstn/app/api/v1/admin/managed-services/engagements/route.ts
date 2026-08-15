import { NextResponse } from 'next/server'
import { requireStaffSession } from '@/lib/auth/session'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listEngagementsForStaff } from '@/lib/modules/managed-services/engagement.service'

// GET /api/v1/admin/managed-services/engagements — Yorkstn Staff triage view.
// Platform admins see every engagement (for assignment); other staff see
// only what's already assigned to them (AUTH_RBAC.md §3).
export const GET = withApiErrorHandling(async () => {
  const staff = await requireStaffSession()
  const engagements = await listEngagementsForStaff(staff.userId, staff.isPlatformAdmin)
  return NextResponse.json({ data: engagements })
})
