import { Link } from 'react-router-dom'
import { AmazonNavbar } from '../components/navigation/AmazonNavbar'
import { SiteFooter } from '../components/common/SiteFooter'

export function NotFoundPage() {
  return (
    <div className="app-container">
      <AmazonNavbar />
      <main className="page-shell" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          {/* Witty 'image failed to load' illustration */}
          <div
            style={{
              width: '180px',
              height: '140px',
              margin: '0 auto 24px',
              border: '2px dashed var(--amber)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--paper)',
            }}
          >
            <span style={{ fontSize: '38px', marginBottom: '8px' }}>🖼️ ❌</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--rose)', fontWeight: 700 }}>
              alt="404: Image Not Found"
            </span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '12px' }}>
            Description Missing (404)
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Even our deterministic rule-based drafter couldn't describe this page—because it doesn't exist in the catalogue.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link to="/review" className="btn-amazon-primary" style={{ textDecoration: 'none' }}>
              Back to Review Workspace
            </Link>
            <Link to="/" className="btn-amazon-secondary" style={{ textDecoration: 'none' }}>
              Home
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
