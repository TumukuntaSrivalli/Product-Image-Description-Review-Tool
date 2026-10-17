import { Link } from 'react-router-dom'
import { AmazonNavbar } from '../components/navigation/AmazonNavbar'
import { Hero3DScene } from '../components/hero3d/Hero3DScene'
import { SiteFooter } from '../components/common/SiteFooter'

export function LandingPage() {
  return (
    <div className="app-container">
      <AmazonNavbar />

      <main className="page-shell" id="main-content">
        {/* Cinematic Hero Section */}
        <section className="landing-hero" aria-label="Hero Section">
          <div className="hero-copy">
            <p className="section-eyebrow">High-Trust Merchant Catalog Studio</p>
            <h1 className="hero-headline">
              Describe what the camera sees. <span className="hero-headline-accent">Nothing more.</span>
            </h1>
            <p className="hero-desc">
              VarnX empowers e-commerce content editors and screen-reader users to publish verifiable, context-aware
              image descriptions. We enforce strict business rules: no unobservable materials, no fake certifications,
              and 100% human-in-the-loop review.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link
                to="/review"
                className="btn-amazon-primary"
                style={{ textDecoration: 'none', fontSize: '1rem', padding: '12px 24px' }}
              >
                ⚡ Open Review Studio (10 Products)
              </Link>
              <Link
                to="/method"
                className="btn-amazon-secondary"
                style={{ textDecoration: 'none', fontSize: '0.94rem', padding: '12px 20px' }}
              >
                Explore Methodology & Rules ↗
              </Link>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--muted)' }}>
              <span>✓ 10 Fixture Images (P01..P10)</span>
              <span>•</span>
              <span>✓ Rule-Based + AI Vision Fallbacks</span>
              <span>•</span>
              <span>✓ UTF-8 BOM CSV Export</span>
            </div>
          </div>

          {/* Interactive R3F Hero 3D Scene */}
          <div style={{ width: '100%' }}>
            <Hero3DScene />
          </div>
        </section>

        {/* How It Works Scroll Story */}
        <section className="how-it-works-section" aria-label="How VarnX Works">
          <p className="section-eyebrow">The Editorial Journey</p>
          <h2 className="section-title">From Observable Signal to Compliant Copy</h2>

          <div className="story-steps-grid">
            <div className="story-step-card">
              <div className="step-num">01</div>
              <h3 style={{ margin: '0 0 10px 0' }}>Automated Transparent Drafting</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Each image is ingested and paired with a deterministic, rule-based draft constructed strictly from
                observable color, shape, and labeled metadata. Every draft transparently carries its provenance tag.
              </p>
            </div>

            <div className="story-step-card">
              <div className="step-num">02</div>
              <h3 style={{ margin: '0 0 10px 0' }}>Editor Review & Live Validation</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Merchant editors refine descriptions in an Amazon-grade workspace. Live validators intercept unverified
                materials, certifications, and superlatives in real-time with red squiggly tooltips.
              </p>
            </div>

            <div className="story-step-card">
              <div className="step-num">03</div>
              <h3 style={{ margin: '0 0 10px 0' }}>Audited One-Click Export</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                Approved descriptions are exported as sanitized, formula-injection safe CSV (UTF-8 BOM) and structured
                JSON, ready for direct ingestion into production product feeds.
              </p>
            </div>
          </div>
        </section>

        {/* Honest Disclosure Banner */}
        <section className="compliance-disclaimer-box" role="note">
          <div className="disclaimer-icon">ℹ️</div>
          <div className="disclaimer-text">
            <strong>Prototype Notice:</strong> VarnX is built with synthetic training fixture data (Case C04). This tool alone
            does NOT prove overall site accessibility compliance, and should be paired with hands-on assistive technology evaluation.
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
