import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { ForbiddenError } from '@/lib/auth/rbac'

/** Standard error envelope from docs/phase2/API_SPECIFICATION.md §0.2. */
export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export class ApiError extends Error {
  code: ApiErrorCode
  status: number
  details?: Record<string, unknown>

  constructor(code: ApiErrorCode, status: number, message: string, details?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

export class UnauthenticatedError extends ApiError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHENTICATED', 401, message)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super('NOT_FOUND', 404, message)
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', 409, message, details)
  }
}

/**
 * Forbidden errors that aren't a docs/phase2/AUTH_RBAC.md permission-matrix
 * check (e.g. "you're not a member of this org at all") — see rbac.ts's
 * `ForbiddenError` for the permission-matrix case, which this class is
 * deliberately separate from so the two failure reasons stay distinguishable
 * in logs/tests even though both currently map to HTTP 403.
 */
export class ForbiddenApiError extends ApiError {
  constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', 403, message)
  }
}

function envelope(code: ApiErrorCode, message: string, details?: Record<string, unknown>) {
  return { error: { code, message, details: details ?? {} } }
}

/**
 * Wraps a Next.js Route Handler so every route gets identical error handling
 * (per API_SPECIFICATION.md §0.2) instead of hand-rolled try/catch per route.
 */
export function withApiErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          envelope('VALIDATION_ERROR', 'Request failed validation.', {
            fields: err.flatten().fieldErrors,
          }),
          { status: 422 },
        )
      }
      if (err instanceof ForbiddenError) {
        return NextResponse.json(
          envelope('FORBIDDEN', 'You do not have permission to perform this action.'),
          { status: 403 },
        )
      }
      if (err instanceof ApiError) {
        return NextResponse.json(envelope(err.code, err.message, err.details), {
          status: err.status,
        })
      }
      // eslint-disable-next-line no-console
      console.error('[api:unhandled]', err)
      return NextResponse.json(envelope('INTERNAL_ERROR', 'Something went wrong.'), {
        status: 500,
      })
    }
  }
}
