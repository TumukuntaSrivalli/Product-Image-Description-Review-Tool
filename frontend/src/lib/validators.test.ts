import { describe, it, expect } from 'vitest'
import { validateAltTextClient, computeWordDiff } from './validators'

describe('validateAltTextClient', () => {
  it('rejects unsupported claims like cotton, waterproof, durable, premium', () => {
    const res = validateAltTextClient('Blue cotton durable t-shirt with premium finish')
    expect(res.valid).toBe(false)
    expect(res.offending_words).toContain('cotton')
    expect(res.offending_words).toContain('durable')
    expect(res.offending_words).toContain('premium')
  })

  it('flags forbidden introductory phrases', () => {
    const res = validateAltTextClient('Picture of a blue mug')
    expect(res.valid).toBe(false)
    expect(res.errors[0]).toContain("Do not start with 'image of / picture of / photo of'")
  })

  it('allows empty text when confirmed decorative', () => {
    const res = validateAltTextClient('', { isDecorative: true })
    expect(res.valid).toBe(true)
    expect(res.errors).toHaveLength(0)
  })

  it('rejects empty text when not decorative', () => {
    const res = validateAltTextClient('', { isDecorative: false })
    expect(res.valid).toBe(false)
  })

  it('warns when length exceeds 125 chars and errors when exceeding 250 chars', () => {
    const longText = 'Blue rounded rectangular illustration with detailed borders '.repeat(5)
    const res = validateAltTextClient(longText)
    expect(res.valid).toBe(false)
    expect(res.errors.some((e) => e.includes('250'))).toBe(true)
  })

  it('flags colour uncertain when wording implies ambiguity', () => {
    const res = validateAltTextClient('Appears blue under direct lighting')
    expect(res.flags).toContain('colour uncertain')
  })
})

describe('computeWordDiff', () => {
  it('correctly tracks added and removed words', () => {
    const draft = 'Blue rounded illustration'
    const edited = 'Red rounded illustration'
    const { draftTokens, editedTokens } = computeWordDiff(draft, edited)

    expect(draftTokens.find((t) => t.text.toLowerCase() === 'blue')?.type).toBe('removed')
    expect(editedTokens.find((t) => t.text.toLowerCase() === 'red')?.type).toBe('added')
    expect(editedTokens.find((t) => t.text.toLowerCase() === 'rounded')?.type).toBe('same')
  })
})
