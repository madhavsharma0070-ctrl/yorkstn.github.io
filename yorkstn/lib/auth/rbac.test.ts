import { describe, it, expect } from 'vitest'
import { can, requirePermission, ForbiddenError } from './rbac'

// Exercises docs/phase2/AUTH_RBAC.md §2's permission matrix directly —
// this is what AC US-60/61 means by testing RBAC "by calling the route
// handler with a crafted session," one level down at the matrix itself.
describe('RBAC permission matrix', () => {
  it('owner can do everything', () => {
    expect(can('owner', 'org:delete')).toBe(true)
    expect(can('owner', 'billing:edit')).toBe(true)
    expect(can('owner', 'compliance:edit')).toBe(true)
  })

  it('admin can manage members and edit compliance, but cannot delete the org or edit billing', () => {
    expect(can('admin', 'members:manage')).toBe(true)
    expect(can('admin', 'compliance:edit')).toBe(true)
    expect(can('admin', 'org:delete')).toBe(false)
    expect(can('admin', 'billing:edit')).toBe(false)
  })

  it('compliance_manager can edit compliance but not trigger market-intelligence generation', () => {
    expect(can('compliance_manager', 'compliance:edit')).toBe(true)
    expect(can('compliance_manager', 'entity_formation:recommend')).toBe(true)
    expect(can('compliance_manager', 'market_intelligence:generate')).toBe(false)
    expect(can('compliance_manager', 'partners:introduce')).toBe(false)
  })

  it('analyst_editor can edit expansion and introduce partners but not edit compliance', () => {
    expect(can('analyst_editor', 'expansion:edit')).toBe(true)
    expect(can('analyst_editor', 'partners:introduce')).toBe(true)
    expect(can('analyst_editor', 'compliance:edit')).toBe(false)
    expect(can('analyst_editor', 'members:manage')).toBe(false)
  })

  it('viewer can view everything but edit nothing', () => {
    expect(can('viewer', 'market_intelligence:view')).toBe(true)
    expect(can('viewer', 'compliance:view')).toBe(true)
    expect(can('viewer', 'expansion:view')).toBe(true)
    expect(can('viewer', 'compliance:edit')).toBe(false)
    expect(can('viewer', 'expansion:edit')).toBe(false)
    expect(can('viewer', 'readiness_score:recalculate')).toBe(false)
  })

  it('a null/undefined role has no permissions', () => {
    expect(can(null, 'org_profile:view')).toBe(false)
    expect(can(undefined, 'notifications:own')).toBe(false)
  })

  it('requirePermission throws ForbiddenError when the role lacks the permission', () => {
    expect(() => requirePermission('viewer', 'compliance:edit')).toThrow(ForbiddenError)
    expect(() => requirePermission('owner', 'compliance:edit')).not.toThrow()
  })
})
