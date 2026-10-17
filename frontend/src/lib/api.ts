import type { ExportApiResponse, ImagesApiResponse, ReviewSavePayload } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export async function fetchImages(): Promise<ImagesApiResponse> {
  const response = await fetch(`${API_BASE}/api/images`)
  if (!response.ok) {
    throw new Error(`Unable to load product review data: ${response.statusText}`)
  }
  return response.json()
}

export async function generateDrafts(productId?: string): Promise<{ images: any[]; count: number }> {
  const body = productId && productId !== 'all' ? { product_id: productId } : { product_id: 'all' }
  const response = await fetch(`${API_BASE}/api/drafts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Unable to generate draft: ${response.statusText}`)
  }
  return response.json()
}

export async function updateReview(productId: string, payload: ReviewSavePayload) {
  const response = await fetch(`${API_BASE}/api/review/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.detail?.message || 'Unable to save review')
  }
  return response.json()
}

export async function approveReview(productId: string) {
  const response = await fetch(`${API_BASE}/api/review/${productId}/approve`, {
    method: 'POST',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err.detail?.message || (Array.isArray(err.detail?.errors) ? err.detail.errors.join(', ') : 'Unable to approve review')
    throw new Error(msg)
  }
  return response.json()
}

export async function flagReview(productId: string, reason: string = 'needs better source image') {
  const response = await fetch(`${API_BASE}/api/review/${productId}/flag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!response.ok) {
    throw new Error('Unable to flag review')
  }
  return response.json()
}

export async function resetReview(productId: string) {
  const response = await fetch(`${API_BASE}/api/review/${productId}/reset`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error('Unable to reset review')
  }
  return response.json()
}

export async function fetchExportJson(): Promise<ExportApiResponse> {
  const response = await fetch(`${API_BASE}/api/export.json`)
  if (!response.ok) {
    throw new Error('Unable to fetch export JSON')
  }
  return response.json()
}

export function getExportCsvUrl(): string {
  return `${API_BASE}/api/export.csv`
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) })
    return response.ok
  } catch {
    return false
  }
}
