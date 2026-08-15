import { describe, it, expect } from 'vitest'
import { isContentStale, STALENESS_THRESHOLD_DAYS } from './content-staleness'

describe('isContentStale', () => {
  it('treats null/undefined as stale (never-verified is not "fine by default")', () => {
    expect(isContentStale(null)).toBe(true)
    expect(isContentStale(undefined)).toBe(true)
  })

  it('treats recently-verified content as not stale', () => {
    expect(isContentStale(new Date())).toBe(false)
  })

  it('treats content older than the threshold as stale', () => {
    const old = new Date(Date.now() - (STALENESS_THRESHOLD_DAYS + 1) * 24 * 60 * 60 * 1000)
    expect(isContentStale(old)).toBe(true)
  })

  it('treats content just under the threshold as not stale', () => {
    const recent = new Date(Date.now() - (STALENESS_THRESHOLD_DAYS - 1) * 24 * 60 * 60 * 1000)
    expect(isContentStale(recent)).toBe(false)
  })
})
