import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { listLaunchTasks, createLaunchTask } from '@/lib/modules/expansion/launch-tasks.service'

const createSchema = z.object({
  title: z.string().min(1),
  dueAt: z.string().datetime().optional(),
  // Not .uuid()-constrained: seeded roadmap milestones use ids like
  // "seed-milestone-<org>-<phase>" (prisma/seed.ts).
  roadmapMilestoneId: z.string().min(1).optional(),
})

export const GET = withApiErrorHandling(async () => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:view')
  const tasks = await listLaunchTasks(ctx.organizationId)
  return NextResponse.json({ data: tasks })
})

// POST /api/v1/expansion/launch-tasks — US-45.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const ctx = await requireOrgContext()
  requirePermission(ctx.role, 'expansion:edit')

  const body = createSchema.parse(await req.json())
  const task = await createLaunchTask(ctx.organizationId, {
    title: body.title,
    dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    roadmapMilestoneId: body.roadmapMilestoneId,
  })
  return NextResponse.json({ data: task }, { status: 201 })
})
