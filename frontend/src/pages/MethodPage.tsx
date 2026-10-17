export function MethodPage() {
  return (
    <main className="page-shell method-page">
      <header className="page-header">
        <p className="eyebrow">Method</p>
        <h2>How ALTLUME keeps review decisions honest</h2>
      </header>
      <section className="method-card">
        <p>
          ALTLUME uses a strict review checklist: observable detail only, no unsupported claims,
          clear handling of uncertainty, and explicit confirmation when an image is decorative.
        </p>
        <p>
          This tool is a review and export aid, not proof of accessibility compliance. The final site
          still needs proper testing and implementation according to WCAG and relevant guidance.
        </p>
        <a href="https://www.w3.org/WAI/tutorials/images/" target="_blank" rel="noreferrer">
          W3C alt-text guidance
        </a>
      </section>
    </main>
  )
}
