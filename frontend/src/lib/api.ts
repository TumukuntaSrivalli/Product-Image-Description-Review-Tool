const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

export async function fetchImages() {
  const response = await fetch(`${API_BASE}/api/images`)
  if (!response.ok) throw new Error('Unable to load product review data')
  return response.json()
}

export async function generateDraft(productId: string) {
  const response = await fetch(`${API_BASE}/api/drafts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId }),
  })
  if (!response.ok) throw new Error('Unable to generate draft')
  return response.json()
}

export async function updateReview(productId: string, payload: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/review/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Unable to save review')
  return response.json()
}

export async function approveReview(productId: string) {
  const response = await fetch(`${API_BASE}/api/review/${productId}/approve`, { method: 'POST' })
  if (!response.ok) throw new Error('Unable to approve review')
  return response.json()
}

export async function flagReview(productId: string, reason: string) {
  const response = await fetch(`${API_BASE}/api/review/${productId}/flag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  })
  if (!response.ok) throw new Error('Unable to flag review')
  return response.json()
}

export async function resetReview(productId: string) {
  const response = await fetch(`${API_BASE}/api/review/${productId}/reset`, { method: 'POST' })
  if (!response.ok) throw new Error('Unable to reset review')
  return response.json()
}
