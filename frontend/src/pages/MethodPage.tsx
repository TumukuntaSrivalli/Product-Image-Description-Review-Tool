import { AmazonNavbar } from '../components/navigation/AmazonNavbar'
import { SiteFooter } from '../components/common/SiteFooter'

export function MethodPage() {
  return (
    <div className="app-container">
      <AmazonNavbar />

      <main className="page-shell" id="main-content">
        <header style={{ marginBottom: '32px' }}>
          <p className="section-eyebrow">Methodology & Business Rules</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', margin: '4px 0 12px 0' }}>
            Why Accuracy Precedes Publication
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '720px' }}>
            Screen-reader users rely on alt text to understand what an image actually depicts, not what marketing copy wishes it to be.
            Here is our complete validation framework.
          </p>
        </header>

        {/* Rules Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Rule 1 */}
          <div className="story-step-card">
            <div className="step-num">01</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Block Unsupported Claims</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              A synthetic or digital illustration cannot prove unobservable properties. We hard-block unverifiable claims of
              <strong> materials</strong> (cotton, leather, ceramic, steel), <strong>certifications</strong> (ISO, BIS, CE, organic),
              <strong> performance</strong> (waterproof, durable, ergonomic), and <strong>superlatives</strong> (premium, best, ultimate).
            </p>
          </div>

          {/* Rule 2 */}
          <div className="story-step-card">
            <div className="step-num">02</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Concise Length Guidelines</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Alt text should be concise. Descriptions above 125 characters trigger an advisory warning, while descriptions
              exceeding 250 characters are blocked. Empty text is strictly prohibited unless marked decorative.
            </p>
          </div>

          {/* Rule 3 */}
          <div className="story-step-card">
            <div className="step-num">03</div>
            <h3 style={{ margin: '0 0 8px 0' }}>No Redundant Intro Phrases</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Screen readers already announce "graphic" or "image" before reading alt text. Starting descriptions with
              "image of", "picture of", or "photo of" creates unnecessary auditory noise and is blocked.
            </p>
          </div>

          {/* Rule 4 */}
          <div className="story-step-card">
            <div className="step-num">04</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Colour Uncertainty & Nuance</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              When catalogue metadata conflicts with observable colour, or when wording indicates subjective ambiguity
              (e.g. "appears blue"), the item is flagged with "colour uncertain" while remaining fully editable.
            </p>
          </div>

          {/* Rule 5 */}
          <div className="story-step-card">
            <div className="step-num">05</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Explicit Decorative Confirmation</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Decorative graphics should carry empty alt text (<code>alt=""</code>) so assistive devices skip them. However,
              an editor must explicitly confirm this status to prevent accidental blank submissions.
            </p>
          </div>

          {/* Rule 6 */}
          <div className="story-step-card">
            <div className="step-num">06</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Text Transcription Requirement</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              If an image contains visible text, banners, or badges, the editor must ensure the exact text is transcribed
              in the alt text so non-sighted users receive the same essential product information.
            </p>
          </div>

          {/* Rule 7 */}
          <div className="story-step-card">
            <div className="step-num">07</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Multiple Products Shown</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              When an illustration depicts a bundle, set, or assortment, the description must represent the group rather
              than singling out an isolated item.
            </p>
          </div>

          {/* Rule 8 */}
          <div className="story-step-card">
            <div className="step-num">08</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Avoid Repeating Adjacent Copy</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              If adjacent copy (e.g. product title or bullet points) already conveys the visual detail, the alt text
              should be shorter to avoid tedious repetition for screen-reader users.
            </p>
          </div>

          {/* Rule 9 */}
          <div className="story-step-card">
            <div className="step-num">09</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Re-Review on Mutation</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Any post-approval edit immediately revokes approved status and transitions the item to "needs re-review",
              preventing unvalidated copy from slipping into production.
            </p>
          </div>
        </div>

        {/* Official Reference Link */}
        <section
          style={{
            background: 'var(--panel-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            marginTop: '36px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0' }}>Official Standards & Resources</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Our rules align with the World Wide Web Consortium (W3C) Web Accessibility Initiative (WAI) recommendations.
            Learn more at the official{' '}
            <a
              href="https://www.w3.org/WAI/tutorials/images/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--amazon-gold)', fontWeight: 700, textDecoration: 'underline' }}
            >
              W3C Image Alt Decision Tree & Tutorials ↗
            </a>
            .
          </p>
        </section>

        {/* Compliance Disclaimer Note */}
        <section className="compliance-disclaimer-box" role="note" style={{ marginTop: '24px' }}>
          <div className="disclaimer-icon">⚠️</div>
          <div className="disclaimer-text">
            <strong>Mandatory Legal & Accessibility Notice:</strong> ALTLUME alone does NOT constitute or prove website
            accessibility compliance. While accurate alternative text is a WCAG 2.1 Success Criterion 1.1.1 requirement,
            conformance requires comprehensive site-wide evaluations including keyboard navigation, color contrast, focus order,
            and user testing with assistive devices.
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
