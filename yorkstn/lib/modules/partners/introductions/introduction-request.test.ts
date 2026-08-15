import { describe, it, expect } from 'vitest'
import { isValidIntroductionTransition } from './introduction-request.service'

describe('isValidIntroductionTransition (US-33 state machine)', () => {
  it('allows sent -> partner_viewed, accepted, or declined', () => {
    expect(isValidIntroductionTransition('sent', 'partner_viewed')).toBe(true)
    expect(isValidIntroductionTransition('sent', 'accepted')).toBe(true)
    expect(isValidIntroductionTransition('sent', 'declined')).toBe(true)
  })

  it('allows partner_viewed -> accepted or declined, not back to sent', () => {
    expect(isValidIntroductionTransition('partner_viewed', 'accepted')).toBe(true)
    expect(isValidIntroductionTransition('partner_viewed', 'declined')).toBe(true)
    expect(isValidIntroductionTransition('partner_viewed', 'sent')).toBe(false)
  })

  it('disallows any transition once accepted or declined (terminal states)', () => {
    expect(isValidIntroductionTransition('accepted', 'declined')).toBe(false)
    expect(isValidIntroductionTransition('declined', 'accepted')).toBe(false)
  })
})
