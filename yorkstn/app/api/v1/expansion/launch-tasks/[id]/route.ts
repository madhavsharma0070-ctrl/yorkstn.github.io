import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOrgContext } from '@/lib/auth/session'
import { requirePermission } from '@/lib/auth/rbac'
import { withApiErrorHandling } from '@/lib/http/errors'
import { updateLaunchTask } from '@/lib/modules/expansion/launch-tasks.service'
import { launchTaskStatusSchema } from '@/lib/validation/enums'
import { writeAuditLog } from '@/lib/audit'

const updateSchema = z.object({ status: launchTaskStatusSchema })

export const PATCH = withApiErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const ctx = await requireOrgContext()
    requirePermission(ctx.role, 'expansion:edit')

    const { status } = updateSchema.parse(await req.json())
    const task = await updateLaunchTask(ctx.organizationId, params.id, status)

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: 'launch_task.updated',
      entityType: 'launch_task',
      entityId: task.id,
      after: { status: task.status },
    })

    return NextResponse.json({ data: task })
  },
)
