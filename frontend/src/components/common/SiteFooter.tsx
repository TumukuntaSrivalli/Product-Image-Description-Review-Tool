import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, color: '#FF9900', letterSpacing: '0.04em' }}>VarnX</span>
            <span style={{ color: '#666' }}>|</span>
            <span>Product Image Description Review Tool</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#999', maxWidth: '680px', lineHeight: 1.5 }}>
            <strong>Mandatory Transparency Disclosure:</strong> VarnX is an editorial image description review tool. This tool alone does NOT prove site accessibility
            compliance or legal WCAG conformance. It provides structured editorial workflows and transparent validation
            for merchant content editors. Synthetic demonstration fixture (Case C04).
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
          <Link to="/" style={{ color: '#CCC', textDecoration: 'none' }}>Home</Link>
          <Link to="/review" style={{ color: '#CCC', textDecoration: 'none' }}>Workspace</Link>
          <Link to="/export" style={{ color: '#CCC', textDecoration: 'none' }}>Export Studio</Link>
          <Link to="/method" style={{ color: '#CCC', textDecoration: 'none' }}>Methodology</Link>
          <a
            href="https://www.w3.org/WAI/tutorials/images/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FF9900', textDecoration: 'none' }}
          >
            W3C WAI Alt Text ↗
          </a>
        </div>
      </div>
    </footer>
  )
}
