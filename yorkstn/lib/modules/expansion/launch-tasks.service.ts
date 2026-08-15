import { prisma } from '@/lib/db'
import { NotFoundError } from '@/lib/http/errors'

// Feature spec 4.6 — US-45.
export async function listLaunchTasks(organizationId: string) {
  return prisma.launchTask.findMany({
    where: { organizationId },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
  })
}

export async function createLaunchTask(
  organizationId: string,
  input: { title: string; dueAt?: Date; roadmapMilestoneId?: string },
) {
  return prisma.launchTask.create({
    data: {
      organizationId,
      title: input.title,
      dueAt: input.dueAt,
      roadmapMilestoneId: input.roadmapMilestoneId,
    },
  })
}

export async function updateLaunchTask(organizationId: string, taskId: string, status: string) {
  const task = await prisma.launchTask.findUnique({ where: { id: taskId } })
  if (!task || task.organizationId !== organizationId) throw new NotFoundError('Launch task not found.')

  return prisma.launchTask.update({ where: { id: taskId }, data: { status } })
}
