export function LandingPage() {
  return (
    <main className="page-shell landing-page">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-mark">A</span>
          <span className="brand-name">ALTLUME</span>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/review">Review</a>
          <a href="/export">Export</a>
          <a href="/method">Method</a>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Editorial review for image alt text</p>
          <h1>Describe what the image actually shows.</h1>
          <p className="lede">
            ALTLUME helps editors publish accurate image descriptions only after human review,
            with transparent rules and export-ready records.
          </p>
          <div className="cta-row">
            <a className="primary-button" href="/review">Open workspace</a>
            <a className="secondary-button" href="/method">See method</a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="glass-tile tile-1" />
          <div className="glass-tile tile-2" />
          <div className="glass-tile tile-3" />
          <div className="glass-tile tile-4" />
        </div>
      </section>
    </main>
  )
}
