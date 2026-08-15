import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { withApiErrorHandling, ConflictError } from '@/lib/http/errors'
import { writeAuditLog } from '@/lib/audit'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().min(1),
})

// POST /api/v1/auth/signup — docs/phase2/API_SPECIFICATION.md §1, US-01.
// Creates only a `users` row (user_type='org_user'); no organization exists
// yet — the client signs in immediately after, then proceeds to onboarding.
export const POST = withApiErrorHandling(async (req: NextRequest) => {
  const body = signupSchema.parse(await req.json())
  const email = body.email.toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw new ConflictError('An account with this email already exists.')
  }

  const passwordHash = await hashPassword(body.password)
  const user = await prisma.user.create({
    data: { email, passwordHash, name: body.name, userType: 'org_user' },
  })

  await writeAuditLog({
    actorUserId: user.id,
    action: 'user.signed_up',
    entityType: 'user',
    entityId: user.id,
    after: { email: user.email },
  })

  return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name } }, { status: 201 })
})
