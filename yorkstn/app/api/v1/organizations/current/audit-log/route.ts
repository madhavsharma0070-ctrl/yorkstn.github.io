import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'

// GET /api/v1/organizations/current/audit-log — API_SPECIFICATION.md §2, AC US-61.
export const GET = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'audit_log:view')

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 100)

  const logs = await prisma.auditLog.findMany({
    where: { organizationId: ctx.organizationId },
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ data: logs })
})
