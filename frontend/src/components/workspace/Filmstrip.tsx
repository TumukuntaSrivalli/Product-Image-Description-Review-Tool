import type { ImageRecord } from '../../types'

interface FilmstripProps {
  images: ImageRecord[]
  selectedId: string
  onSelect: (productId: string) => void
}

export function Filmstrip({ images, selectedId, onSelect }: FilmstripProps) {
  return (
    <aside className="filmstrip-panel" aria-label="Product Catalogue Filmstrip">
      <div className="filmstrip-header">
        <span>Catalogue ({images.length})</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--amazon-gold)' }}>J / K to navigate</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {images.map((img) => {
          const isSelected = img.product_id === selectedId
          const assetSrc = `/assets/${img.product_id}.png`

          return (
            <button
              key={img.product_id}
              type="button"
              className={`filmstrip-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(img.product_id)}
              aria-selected={isSelected}
              aria-label={`Product ${img.product_id}: ${img.metadata_title || img.visible_description}, status: ${img.status}`}
            >
              <img
                src={assetSrc}
                alt=""
                className="filmstrip-thumb"
                onError={(e) => {
                  // Fallback for missing image
                  const target = e.currentTarget
                  target.style.display = 'none'
                }}
              />

              <div className="filmstrip-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="filmstrip-id">{img.product_id}</span>
                </div>
                <div className="filmstrip-title" title={img.metadata_title || img.visible_description}>
                  {img.metadata_title || img.visible_description}
                </div>

                {img.duplicate_of && (
                  <span className="badge-identical" title={`Visually identical to ${img.duplicate_of}`}>
                    Identical to {img.duplicate_of}
                  </span>
                )}

                {img.status === 'flagged_inaccessible' && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--rose)',
                      background: 'rgba(239, 68, 68, 0.15)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      marginTop: '3px',
                    }}
                  >
                    Inaccessible
                  </span>
                )}
              </div>

              {/* Status Dot */}
              <div
                className={`status-dot ${img.status}`}
                title={`Status: ${img.status.replace('_', ' ')}`}
                aria-hidden="true"
              />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
