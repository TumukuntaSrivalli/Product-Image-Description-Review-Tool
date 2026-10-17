import type { OffendingWordDetail, ValidationResult } from '../types'

export const UNSUPPORTED_WORDS: Record<string, string> = {
  // Material claims
  cotton: 'material',
  leather: 'material',
  ceramic: 'material',
  steel: 'material',
  silicone: 'material',
  wood: 'material',
  plastic: 'material',
  metal: 'material',
  glass: 'material',
  wool: 'material',
  polyester: 'material',
  nylon: 'material',
  linen: 'material',
  silk: 'material',
  denim: 'material',
  canvas: 'material',
  aluminum: 'material',
  titanium: 'material',
  // Certification claims
  iso: 'certification',
  bis: 'certification',
  ce: 'certification',
  certified: 'certification',
  certification: 'certification',
  organic: 'certification',
  fda: 'certification',
  rohs: 'certification',
  gots: 'certification',
  // Performance claims
  waterproof: 'performance',
  durable: 'performance',
  durability: 'performance',
  fast: 'performance',
  ergonomic: 'performance',
  'long-lasting': 'performance',
  lasting: 'performance',
  breathable: 'performance',
  shockproof: 'performance',
  indestructible: 'performance',
  'rust-proof': 'performance',
  'scratch-resistant': 'performance',
  'heavy-duty': 'performance',
  // Identity / brand / person claims
  brand: 'identity',
  logo: 'identity',
  official: 'identity',
  authentic: 'identity',
  genuine: 'identity',
  nike: 'identity',
  apple: 'identity',
  person: 'identity',
  man: 'identity',
  woman: 'identity',
  designer: 'identity',
  // Superlative claims
  premium: 'superlative',
  best: 'superlative',
  top: 'superlative',
  ultimate: 'superlative',
  perfect: 'superlative',
  excellent: 'superlative',
  finest: 'superlative',
  greatest: 'superlative',
  superior: 'superlative',
  unmatched: 'superlative',
  flawless: 'superlative',
}

export const COLOUR_WORDS: Record<string, string> = {
  red: 'red',
  blue: 'blue',
  black: 'black',
  grey: 'grey',
  gray: 'grey',
  green: 'green',
  white: 'white',
  yellow: 'yellow',
  orange: 'orange',
  purple: 'purple',
  brown: 'brown',
  pink: 'pink',
}

export function tokenizeWords(text: string): string[] {
  return (text || '').toLowerCase().match(/[a-z0-9-]+/g) || []
}

export function validateAltTextClient(
  text: string,
  options: {
    isDecorative?: boolean
    metadataTitle?: string | null
    pageContext?: string | null
    containsText?: boolean
    multipleProducts?: boolean
  } = {}
): ValidationResult {
  const {
    isDecorative = false,
    metadataTitle = null,
    pageContext = '',
    containsText = false,
    multipleProducts = false,
  } = options

  const cleaned = (text || '').trim()
  const warnings: string[] = []
  const errors: string[] = []
  const flags: string[] = []
  const offendingWords: string[] = []
  const offendingDetails: OffendingWordDetail[] = []

  // Decorative check
  if (!cleaned) {
    if (isDecorative) {
      return {
        valid: true,
        warnings,
        errors,
        flags,
        offending_words: [],
        offending_details: [],
      }
    }
    errors.push('Description cannot be empty unless confirmed decorative (alt="").')
    return {
      valid: false,
      warnings,
      errors,
      flags,
      offending_words: [],
      offending_details: [],
    }
  }

  // Forbidden intro phrases
  if (/^(image of|picture of|photo of|graphic of|icon of)\b/i.test(cleaned)) {
    errors.push("Do not start with 'image of / picture of / photo of' — screen readers already announce graphic role.")
  }

  // Length constraints
  if (cleaned.length > 125) {
    warnings.push(`Length is ${cleaned.length} characters (recommended target ≤ 125).`)
  }
  if (cleaned.length > 250) {
    errors.push(`Length is ${cleaned.length} characters (hard limit is 250).`)
  }

  // Unsupported claims
  const words = tokenizeWords(cleaned)
  for (const w of words) {
    const category = UNSUPPORTED_WORDS[w]
    if (category) {
      offendingWords.push(w)
      offendingDetails.push({
        word: w,
        category,
        reason: `Unsupported ${category} claim: cannot verify from synthetic product illustration.`,
      })
    }
  }

  if (offendingWords.length > 0) {
    const unique = Array.from(new Set(offendingWords))
    errors.push(`Blocked unsupported claim(s): ${unique.join(', ')}`)
  }

  // Page context repetition
  if (pageContext && pageContext.trim()) {
    const ctx = pageContext.trim().toLowerCase()
    const desc = cleaned.toLowerCase()
    if ((desc.length > 8 && ctx.includes(desc)) || (ctx.length > 8 && desc.includes(ctx))) {
      warnings.push('Avoid repeating adjacent text: description overlaps with page context.')
    }
  }

  // Colour uncertainty
  const descColours = words.filter((w) => COLOUR_WORDS[w]).map((w) => COLOUR_WORDS[w])
  if (descColours.length > 0 && metadataTitle) {
    const titleWords = tokenizeWords(metadataTitle)
    const titleColours = titleWords.filter((w) => COLOUR_WORDS[w]).map((w) => COLOUR_WORDS[w])
    if (titleColours.length > 0 && titleColours[0] !== descColours[0]) {
      flags.push('colour uncertain')
    }
  } else if (new Set(descColours).size > 1) {
    flags.push('colour uncertain')
  }

  if (/\b(appears|seems|uncertain|likely|apparent)\b/i.test(cleaned)) {
    if (!flags.includes('colour uncertain')) {
      flags.push('colour uncertain')
    }
  }

  // Contains text in image
  if (containsText) {
    const hasTrans = /("[^"]+"|'[^']+'|\b(text|word|words|reads|labeled|labelled|lettering|inscribed|writing)\b)/i.test(cleaned)
    if (!hasTrans) {
      errors.push('Image is marked as containing text: please transcribe the text.')
    }
  }

  // Multiple products
  if (multipleProducts) {
    const mentionsSingle = /\b(single|one item|sole)\b/i.test(cleaned)
    const describesGroup = /\b(set|group|collection|pair|multiple|items|trio|pack|assortment|bundle)\b/i.test(cleaned)
    if (mentionsSingle || !describesGroup) {
      warnings.push('Multiple products indicated: describe the full group rather than a single item.')
    }
  }

  return {
    valid: errors.length === 0,
    warnings: Array.from(new Set(warnings)),
    errors: Array.from(new Set(errors)),
    flags: Array.from(new Set(flags)),
    offending_words: Array.from(new Set(offendingWords)),
    offending_details: offendingDetails,
  }
}

// Side-by-side word-level diff utility
export interface DiffToken {
  text: string
  type: 'same' | 'added' | 'removed'
}

export function computeWordDiff(draft: string, edited: string): { draftTokens: DiffToken[]; editedTokens: DiffToken[] } {
  const dWords = (draft || '').split(/\s+/).filter(Boolean)
  const eWords = (edited || '').split(/\s+/).filter(Boolean)

  const dSet = new Set(dWords.map((w) => w.toLowerCase()))
  const eSet = new Set(eWords.map((w) => w.toLowerCase()))

  const draftTokens: DiffToken[] = dWords.map((w) => ({
    text: w,
    type: eSet.has(w.toLowerCase()) ? 'same' : 'removed',
  }))

  const editedTokens: DiffToken[] = eWords.map((w) => ({
    text: w,
    type: dSet.has(w.toLowerCase()) ? 'same' : 'added',
  }))

  return { draftTokens, editedTokens }
}
