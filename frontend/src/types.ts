export type ReviewStatus = 'draft' | 'edited' | 'approved' | 'flagged_inaccessible' | 'decorative' | 'needs_re_review'

export interface ImageRecord {
  product_id: string
  path: string
  visible_description: string
  metadata_title: string | null
  review_note: string | null
  status?: ReviewStatus
  draft?: string
  edited_text?: string
  page_context?: string
  is_decorative?: boolean
  contains_text?: boolean
  multiple_products?: boolean
  flags?: string[]
  source_label?: string
  duplicate_of?: string | null
}
