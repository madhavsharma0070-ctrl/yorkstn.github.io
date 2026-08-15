import { describe, it, expect } from 'vitest'
import { nextStage, TRADEMARK_STAGES } from './ip-timeline.service'

describe('nextStage', () => {
  it('advances through the fixed sequence in order', () => {
    for (let i = 0; i < TRADEMARK_STAGES.length - 1; i++) {
      expect(nextStage(TRADEMARK_STAGES[i])).toBe(TRADEMARK_STAGES[i + 1])
    }
  })

  it('returns null after the final stage (registered)', () => {
    expect(nextStage('registered')).toBeNull()
  })
})
