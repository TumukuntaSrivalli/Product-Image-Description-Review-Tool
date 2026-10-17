export type ReviewStatus =
  | 'draft'
  | 'edited'
  | 'approved'
  | 'flagged_inaccessible'
  | 'decorative'
  | 'needs_re_review'

export interface OffendingWordDetail {
  word: string
  category: 'material' | 'certification' | 'performance' | 'identity' | 'superlative' | string
  reason: string
}

export interface ImageRecord {
  product_id: string
  path: string
  visible_description: string
  metadata_title: string | null
  review_note: string | null
  status: ReviewStatus
  draft: string
  edited_text: string
  page_context: string
  is_decorative: boolean
  contains_text: boolean
  multiple_products: boolean
  flags: string[]
  errors?: string[]
  offending_words?: string[]
  offending_details?: OffendingWordDetail[]
  source_label: string
  duplicate_of: string | null
}

export interface ImagesApiResponse {
  case_id: string
  synthetic: boolean
  images: ImageRecord[]
  count: number
}

export interface ReviewSavePayload {
  edited_text?: string
  page_context?: string
  is_decorative?: boolean
  contains_text?: boolean
  multiple_products?: boolean
}

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  flags: string[]
  offending_words: string[]
  offending_details: OffendingWordDetail[]
}

export interface ExportRecord {
  product_id: string
  final_description: string
  status: ReviewStatus
  edited_by_human: 'true' | 'false'
  flags: string
  source_label: string
}

export interface ExportApiResponse {
  case_id: string
  total_records: number
  exported_records: ExportRecord[]
  images: ImageRecord[]
}
