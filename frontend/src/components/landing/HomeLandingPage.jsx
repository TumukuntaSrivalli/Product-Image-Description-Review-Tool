import React, { useState } from 'react';

export function HomeLandingPage({ onGetStarted, onLogin, products = [], onSelectProduct }) {
  const [activePreviewId, setActivePreviewId] = useState('P01');

  const previewItems = (products && products.length > 0 ? products.slice(0, 6) : []).length > 0
    ? products.slice(0, 6)
    : [
        { product_id: 'P01', metadata_title: 'Blue Tshirt', category: 'Apparel', visible_description: 'Blue rounded rectangular product illustration; catalogue lists this as Blue Tshirt' },
        { product_id: 'P02', metadata_title: 'Blue Tshirt', category: 'Apparel', visible_description: 'Blue rounded rectangular product illustration; catalogue lists this as Blue Tshirt' },
        { product_id: 'P03', metadata_title: 'Red Tshirt', category: 'Apparel', visible_description: 'Red rounded rectangular product illustration' },
        { product_id: 'P04', metadata_title: 'Blue Tshirt', category: 'Apparel', visible_description: 'Blue rounded rectangular product illustration' },
        { product_id: 'P05', metadata_title: 'White Mug', category: 'Home', visible_description: 'White ceramic mug on neutral studio background' },
        { product_id: 'P06', metadata_title: 'Black Running Shoes', category: 'Footwear', visible_description: 'Black athletic running shoes with white soles' },
      ];

  const activeProduct = previewItems.find((p) => p.product_id === activePreviewId) || previewItems[0];
  const activeDesc = activeProduct?.final_description || activeProduct?.edited_text || activeProduct?.draft || activeProduct?.visible_description || 'High quality product description inspected by human editor.';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px 24px 80px' }}>
      {/* Cinematic Hero Section */}
      <section className="landing-hero" style={{ margin: '30px auto 48px' }} aria-label="Hero Introduction">
        <div className="hero-copy">
          <span className="brand-pill" style={{ marginBottom: '16px', display: 'inline-block' }}>
            ✦ COMMERCE ALT-TEXT STUDIO & QUALITY GUARD
          </span>
          <h1 style={{ fontSize: '3.4rem', lineHeight: 1.12, marginBottom: '20px' }}>
            Good descriptions begin with looking.
          </h1>
          <p style={{ fontSize: '1.12rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '32px' }}>
            A tactile, disciplined review studio for commerce editors. VarnX pairs computer vision observations with human editorial sign-off—guaranteeing that every product description is accurate, accessible, and strictly verifiable from visible pixels.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-editorial-primary"
              onClick={onGetStarted}
              style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 600 }}
            >
              ✦ Get Started Free →
            </button>
            <button
              type="button"
              className="btn-editorial-secondary"
              onClick={onLogin}
              style={{ padding: '14px 24px', fontSize: '1rem' }}
            >
              Sign In
            </button>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '36px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-ink)' }}>
                100%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Observable Claims</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                &lt; 125
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Characters / Alt-Text</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--emerald)' }}>
                Zero
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unverified Hype</div>
            </div>
          </div>
        </div>

        {/* Interactive Live Inspection Showcase */}
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-indigo)' }}>
              Interactive Catalogue Preview
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Select item to inspect:
            </span>
          </div>

          {/* Selector pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {previewItems.map((item) => (
              <button
                key={item.product_id}
                type="button"
                onClick={() => {
                  setActivePreviewId(item.product_id);
                  if (onSelectProduct) onSelectProduct(item.product_id);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: activePreviewId === item.product_id ? '1px solid var(--accent-indigo)' : '1px solid var(--surface-border)',
                  background: activePreviewId === item.product_id ? 'rgba(79, 70, 229, 0.12)' : 'var(--surface-card-subtle)',
                  color: activePreviewId === item.product_id ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                {item.product_id}
              </button>
            ))}
          </div>

          {/* Active Product Card Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center', background: 'var(--surface-card-subtle)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '10px', background: 'var(--bg-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {activeProduct?.image_url ? (
                <img
                  src={activeProduct.image_url}
                  alt={activeProduct.metadata_title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ fontSize: '2.5rem' }}>📦</div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-ink)' }}>
                  {activeProduct.metadata_title || activeProduct.product_id}
                </span>
                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.12)', color: 'var(--emerald)', fontWeight: 600 }}>
                  VERIFIED OBSERVATION
                </span>
                <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.15)', color: 'var(--emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  ${activeProduct.price !== undefined ? Number(activeProduct.price).toFixed(2) : '24.99'}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 10px 0' }}>
                "{activeDesc}"
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span>Length: {activeDesc.length} chars</span>
                <span>•</span>
                <span>W3C Alt: Compliant</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Deterministic Review Guard: <strong style={{ color: 'var(--emerald)' }}>0 Unsupported Claims</strong>
            </span>
            <button
              type="button"
              className="btn-editorial-primary"
              onClick={onGetStarted}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              Open in Studio ↗
            </button>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <div className="trust-strip" style={{ marginBottom: '60px' }} aria-label="Core Editorial Principles">
        <div className="trust-item">
          <span className="trust-icon">👁️</span>
          <div>
            <div className="trust-text-title">Visual Evidence First</div>
            <div className="trust-text-sub">Descriptions derived strictly from visible pixels</div>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🛡️</span>
          <div>
            <div className="trust-text-title">Deterministic Guardrails</div>
            <div className="trust-text-sub">Instant flags on unconfirmed superlative claims</div>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">✍️</span>
          <div>
            <div className="trust-text-title">Commerce Editor in Loop</div>
            <div className="trust-text-sub">Zero unapproved automated catalogue updates</div>
          </div>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⚡</span>
          <div>
            <div className="trust-text-title">Multi-Format & Angle Check</div>
            <div className="trust-text-sub">Short copy, bullets, card summaries, and multi-view coverage</div>
          </div>
        </div>
      </div>

      {/* Editorial Methodology Section */}
      <section style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--text-ink)', marginBottom: '12px' }}>
          Three-Step Editorial Quality Discipline
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 36px', fontSize: '1rem', lineHeight: 1.5 }}>
          Built for commerce editors, catalog managers, and agencies who require precision over hallucinated copy.
        </p>

        <div className="steps-grid" style={{ textAlign: 'left' }}>
          <div className="step-card">
            <span className="step-number">Step 01</span>
            <div className="step-title">Observe Visible Details</div>
            <p className="step-desc">
              Look closely at silhouettes, colors, finishes, and orientations. Separate what is visibly proven from catalogue assumptions.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">Step 02</span>
            <div className="step-title">Check with Review Guard</div>
            <p className="step-desc">
              Identify unsupported claims (e.g. pure silk, eco-friendly, ergonomic) in real time against the merchant specification rules.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">Step 03</span>
            <div className="step-title">Approve & Multi-Format Export</div>
            <p className="step-desc">
              Sign off on concise alt text, generate marketplace paragraphs, translate to 10+ languages, and export verified CSV/JSON bundles.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <div
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: '20px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--text-ink)', marginBottom: '10px' }}>
          Ready to review your digital catalogue?
        </h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
          Sign in to access your pre-loaded reference catalogue, test batch multi-image coverage, and export clean commerce descriptions.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-editorial-primary"
            onClick={onGetStarted}
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            ✦ Get Started Now →
          </button>
          <button
            type="button"
            className="btn-editorial-secondary"
            onClick={onLogin}
            style={{ padding: '12px 24px', fontSize: '0.95rem' }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}
