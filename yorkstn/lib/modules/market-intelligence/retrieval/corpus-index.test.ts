import { describe, it, expect } from 'vitest'
import { retrieve } from './corpus-index'

describe('retrieve (tag-overlap corpus retrieval)', () => {
  it('returns matching entries for a known tag', () => {
    const hits = retrieve(['distribution'])
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.tags.includes('distribution'))).toBe(true)
  })

  it('returns an empty array for a tag with no corpus coverage', () => {
    const hits = retrieve(['nonexistent-tag-xyz'])
    expect(hits).toEqual([])
  })

  it('ranks entries matching more tags higher', () => {
    const hits = retrieve(['general', 'pricing'])
    expect(hits.length).toBeGreaterThan(0)
    // The top hit should have at least as much tag overlap as the last hit.
    const topOverlap = hits[0].tags.filter((t) => ['general', 'pricing'].includes(t)).length
    const lastOverlap = hits[hits.length - 1].tags.filter((t) => ['general', 'pricing'].includes(t)).length
    expect(topOverlap).toBeGreaterThanOrEqual(lastOverlap)
  })

  it('respects the limit parameter', () => {
    const hits = retrieve(['general'], 2)
    expect(hits.length).toBeLessThanOrEqual(2)
  })
})
