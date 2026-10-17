import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useReviewStore } from '../../store/useReviewStore'

interface AmazonNavbarProps {
  reviewedCount?: number
  totalCount?: number
}

export function AmazonNavbar({ reviewedCount = 0, totalCount = 10 }: AmazonNavbarProps) {
  const { theme, toggleTheme, setShowShortcutsModal, setShowCommandPalette } = useReviewStore()
  const location = useLocation()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const currentScroll = window.scrollY
      if (totalScroll > 0) {
        setScrollProgress((currentScroll / totalScroll) * 100)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const radius = 14
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (reviewedCount / totalCount) * circumference

  return (
    <header className="amazon-topbar" role="banner">
      <div className="amazon-topbar-inner">
        {/* Amazon Logo & Brand */}
        <Link to="/" className="amazon-brand" aria-label="VarnX Home">
          <div className="amazon-brand-logo" aria-hidden="true">
            <span>V</span>
          </div>
          <div className="amazon-brand-text">
            <span className="amazon-brand-title">VarnX</span>
            <span className="amazon-brand-subtitle">Catalog Review Studio</span>
          </div>
        </Link>

        {/* Amazon Style Search & Jump Bar */}
        <div className="amazon-search-bar">
          <div className="amazon-search-prefix">Catalogue</div>
          <input
            type="text"
            className="amazon-search-input"
            placeholder="Search P01..P10, commands, or press Ctrl+K..."
            aria-label="Search catalogue and commands (Ctrl+K)"
            onClick={() => setShowCommandPalette(true)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowCommandPalette(true)}
            readOnly
          />
          <span style={{ padding: '0 10px', color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            ⌘K
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="amazon-nav-links" aria-label="Main Navigation">
          <Link
            to="/review"
            className={`amazon-nav-item ${location.pathname === '/review' ? 'active' : ''}`}
          >
            <span>Workspace</span>
            <span className="amazon-nav-badge">{reviewedCount}/{totalCount}</span>
          </Link>
          <Link
            to="/export"
            className={`amazon-nav-item ${location.pathname === '/export' ? 'active' : ''}`}
          >
            <span>Export Studio</span>
          </Link>
          <Link
            to="/method"
            className={`amazon-nav-item ${location.pathname === '/method' ? 'active' : ''}`}
          >
            <span>Methodology</span>
          </Link>

          {/* Progress Ring */}
          <div className="progress-ring-container" title={`${reviewedCount} of ${totalCount} reviewed`}>
            <svg width="34" height="34" className="progress-ring-svg" aria-hidden="true">
              <circle
                cx="17"
                cy="17"
                r={radius}
                className="progress-ring-bg"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="17"
                cy="17"
                r={radius}
                className="progress-ring-fill"
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="progress-text">{reviewedCount}/{totalCount}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn-ghost"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode (T)`}
            style={{ color: '#FFF', borderColor: 'rgba(255,255,255,0.2)', padding: '6px 10px' }}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Shortcuts Help Modal Trigger */}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowShortcutsModal(true)}
            aria-label="Keyboard shortcuts (?)"
            title="Keyboard shortcuts (?)"
            style={{ color: '#FF9900', borderColor: 'rgba(255,153,0,0.3)', padding: '6px 10px', fontWeight: 800 }}
          >
            ?
          </button>
        </nav>
      </div>

      {/* Dynamic Scroll Progress Bar */}
      <div
        className="scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />
    </header>
  )
}
