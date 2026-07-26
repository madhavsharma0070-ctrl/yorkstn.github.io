import { describe, it, expect } from 'vitest'
import { slugify } from './slug'

describe('slugify', () => {
  it('lowercases and dashes a normal name', () => {
    expect(slugify('Acme Kids Apparel')).toBe('acme-kids-apparel')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify("Priya's Brand & Co.")).toBe('priya-s-brand-co')
  })

  it('trims leading/trailing dashes', () => {
    expect(slugify('  --Yorkstn--  ')).toBe('yorkstn')
  })
})
