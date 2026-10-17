import { Link } from 'react-router-dom'
import { useReviewStore } from '../../store/useReviewStore'

interface AmazonSubnavProps {
  counts: {
    all: number
    needsReview: number
    approved: number
    flagged: number
  }
  onGenerateAllDrafts?: () => void
  isGenerating?: boolean
}

export function AmazonSubnav({ counts, onGenerateAllDrafts, isGenerating = false }: AmazonSubnavProps) {
  const { activeFilter, setActiveFilter } = useReviewStore()

  return (
    <div className="amazon-subnav" role="toolbar" aria-label="Review Queue Filters">
      <div className="amazon-subnav-inner">
        <div className="amazon-subnav-queue">
          <span style={{ fontWeight: 700, color: '#AAA', textTransform: 'uppercase', fontSize: '0.74rem' }}>
            Queue:
          </span>
          <button
            type="button"
            className={`queue-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Products ({counts.all})
          </button>
          <button
            type="button"
            className={`queue-pill ${activeFilter === 'needs_review' ? 'active' : ''}`}
            onClick={() => setActiveFilter('needs_review')}
          >
            Needs Review ({counts.needsReview})
          </button>
          <button
            type="button"
            className={`queue-pill ${activeFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveFilter('approved')}
          >
            Approved ({counts.approved})
          </button>
          <button
            type="button"
            className={`queue-pill ${activeFilter === 'flagged' ? 'active' : ''}`}
            onClick={() => setActiveFilter('flagged')}
          >
            Flagged Inaccessible ({counts.flagged})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onGenerateAllDrafts && (
            <button
              type="button"
              className="btn-amazon-secondary"
              onClick={onGenerateAllDrafts}
              disabled={isGenerating}
              style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.8rem' }}
            >
              {isGenerating ? 'Generating...' : '⚡ Generate All Drafts'}
            </button>
          )}
          <Link
            to="/export"
            className="btn-amazon-primary"
            style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
          >
            Export All (CSV/JSON)
          </Link>
        </div>
      </div>
    </div>
  )
}
