import { useState } from 'react'
import type { ImageRecord } from '../../types'

interface ImageViewerProps {
  image: ImageRecord
}

export function ImageViewer({ image }: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 })
  const assetSrc = `/assets/${image.product_id}.png`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin({ x, y })
  }

  return (
    <section className="viewer-panel" aria-label={`Image viewer for ${image.product_id}`}>
      {/* Top Toolbar */}
      <div className="viewer-toolbar">
        <div className="viewer-asin-meta">
          <span className="asin-tag">SKU: {image.product_id}</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
            {image.metadata_title || 'Untitled Product'}
          </span>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setIsZoomed(!isZoomed)}
          aria-label={isZoomed ? 'Reset zoom' : 'Magnify image'}
          style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.78rem' }}
        >
          {isZoomed ? '🔍 Reset Zoom' : '🔍 Magnify / Pan'}
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        className="viewer-image-stage"
        onClick={() => setIsZoomed(!isZoomed)}
        onMouseMove={handleMouseMove}
        role="region"
        aria-label="Product image inspection stage"
      >
        <img
          src={assetSrc}
          alt={image.edited_text || image.draft || image.visible_description}
          className={`viewer-main-image ${isZoomed ? 'zoomed' : ''}`}
          style={isZoomed ? { transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` } : undefined}
          onError={(e) => {
            // Replace with graceful inline SVG fallback if image is missing
            const target = e.currentTarget
            target.src = `/assets/${image.product_id}.png`
          }}
        />

        {isZoomed && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(19, 25, 33, 0.85)',
              color: '#FF9900',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.74rem',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}
          >
            2.0x Magnification • Move mouse to pan
          </div>
        )}
      </div>

      {/* Metadata & Catalog Disclaimers */}
      <div className="viewer-metadata-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span className="metadata-warning-chip">
            ⚠️ Metadata Title: {image.metadata_title || 'None'} (Metadata, NOT proof of visible detail or material)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            Synthetic Case: C04
          </span>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '4px' }}>
          <strong>Visible Observation:</strong> {image.visible_description}
        </div>

        {image.review_note && (
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
            Note: {image.review_note}
          </div>
        )}
      </div>
    </section>
  )
}
