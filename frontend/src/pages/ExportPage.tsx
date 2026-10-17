export function ExportPage() {
  return (
    <main className="page-shell export-page">
      <header className="page-header">
        <p className="eyebrow">Export</p>
        <h2>Ready to publish</h2>
      </header>
      <section className="export-card">
        <ul>
          <li>10 product IDs included</li>
          <li>Descriptions reviewed and approved</li>
          <li>CSV and JSON export available</li>
        </ul>
        <div className="cta-row">
          <button type="button" className="primary-button">Download CSV</button>
          <button type="button" className="secondary-button">Download JSON</button>
        </div>
        <p className="disclaimer">
          This tool does not prove full site accessibility compliance. It supports editorial review
          and export of alt text decisions, not a legal or technical guarantee.
        </p>
      </section>
    </main>
  )
}
