import type { MembershipRole } from '@/lib/validation/enums'

/**
 * The literal RBAC permission matrix from docs/phase2/AUTH_RBAC.md §2.
 * This is the ONE place role -> permission mappings are decided. Every API
 * route calls `requirePermission`/`can` against this table rather than
 * hand-rolling a role check — see AUTH_RBAC.md §5 ("defense in depth — the
 * hard rule") for why that matters: UI hiding is a convenience, this is the
 * actual enforcement boundary.
 */
export type Permission =
  | 'org_profile:view'
  | 'org_profile:edit'
  | 'billing:view'
  | 'billing:edit'
  | 'members:manage'
  | 'audit_log:view'
  | 'org:delete'
  | 'market_intelligence:view'
  | 'market_intelligence:generate'
  | 'readiness_score:view'
  | 'readiness_score:recalculate'
  | 'compliance:view'
  | 'compliance:edit'
  | 'entity_formation:recommend'
  | 'partners:view'
  | 'partners:introduce'
  | 'expansion:view'
  | 'expansion:edit'
  | 'managed_services:request'
  | 'notifications:own'

const ALL_ROLES: MembershipRole[] = [
  'owner',
  'admin',
  'compliance_manager',
  'analyst_editor',
  'viewer',
]

// Explicit allow-list per permission. Absence = denied. Keep this literal and
// scannable against docs/phase2/AUTH_RBAC.md §2's table rather than clever —
// a reviewer should be able to diff this against that table by eye.
const MATRIX: Record<Permission, MembershipRole[]> = {
  'org_profile:view': ALL_ROLES,
  'org_profile:edit': ['owner', 'admin'],
  'billing:view': ['owner', 'admin'],
  'billing:edit': ['owner'],
  'members:manage': ['owner', 'admin'],
  'audit_log:view': ['owner', 'admin'],
  'org:delete': ['owner'],
  'market_intelligence:view': ALL_ROLES,
  'market_intelligence:generate': ['owner', 'admin', 'analyst_editor'],
  'readiness_score:view': ALL_ROLES,
  'readiness_score:recalculate': ['owner', 'admin', 'compliance_manager', 'analyst_editor'],
  'compliance:view': ALL_ROLES,
  'compliance:edit': ['owner', 'admin', 'compliance_manager'],
  'entity_formation:recommend': ['owner', 'admin', 'compliance_manager'],
  'partners:view': ALL_ROLES,
  'partners:introduce': ['owner', 'admin', 'analyst_editor'],
  'expansion:view': ALL_ROLES,
  'expansion:edit': ['owner', 'admin', 'analyst_editor'],
  'managed_services:request': ['owner', 'admin', 'compliance_manager'],
  'notifications:own': ALL_ROLES,
}

export function can(role: MembershipRole | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return MATRIX[permission].includes(role)
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`)
    this.name = 'ForbiddenError'
  }
}

/** Throws ForbiddenError (caught by the shared API error handler, see lib/http/errors.ts) if the role lacks the permission. */
export function requirePermission(
  role: MembershipRole | null | undefined,
  permission: Permission,
): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission)
  }
}
