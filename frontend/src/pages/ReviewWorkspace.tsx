export function ReviewWorkspace() {
  return (
    <main className="page-shell review-page">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Review workspace</p>
          <h2>Image description review</h2>
        </div>
        <div className="workspace-actions">
          <button type="button">Generate all drafts</button>
          <a href="/export">Export</a>
        </div>
      </header>
      <section className="workspace-grid">
        <aside className="filmstrip" aria-label="Product list">
          <div className="filmstrip-item active">P01</div>
          <div className="filmstrip-item">P02</div>
          <div className="filmstrip-item">P03</div>
          <div className="filmstrip-item">P04</div>
          <div className="filmstrip-item">P05</div>
        </aside>
        <div className="viewer-panel">
          <div className="image-card">Product illustration preview</div>
        </div>
        <aside className="editor-panel">
          <div className="draft-chip">rule-based fallback</div>
          <label htmlFor="review-text">Image description</label>
          <textarea id="review-text" defaultValue="Blue rounded rectangular product illustration" />
          <label htmlFor="page-context">Page context</label>
          <textarea id="page-context" defaultValue="" placeholder="Add adjacent page context" />
          <div className="toggle-row">
            <label><input type="checkbox" /> Decorative</label>
            <label><input type="checkbox" /> Contains text</label>
            <label><input type="checkbox" /> Multiple products</label>
          </div>
          <div className="validation-card">
            <h3>Validation</h3>
            <ul>
              <li>Length: OK</li>
              <li>Colour flag: none</li>
              <li>Unsupported claims: none</li>
            </ul>
          </div>
          <div className="editor-actions">
            <button type="button" className="primary-button">Approve</button>
            <button type="button">Flag inaccessible</button>
            <button type="button">Reset</button>
          </div>
        </aside>
      </section>
    </main>
  )
}
