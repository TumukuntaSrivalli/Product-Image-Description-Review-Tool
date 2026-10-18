import React from 'react';

export function BatchView({
  products = [],
  onOpenUpload,
  onOpenGroupingStudio,
  onGenerateAllMultiFormat,
  onApproveLowRisk,
  onSelectProduct,
  computeClientReadinessScore,
  computeClientViewCoverage,
  isBatchGenerating = false,
}) {
  const totalProducts = products.length;
  const multiImageProducts = products.filter((p) => (p.images && p.images.length > 1) || p.has_multi_images).length;
  const readyProducts = products.filter((p) => {
    const score = computeClientReadinessScore ? computeClientReadinessScore(p) : { score: 70 };
    return score.status === 'READY' || score.score >= 80;
  }).length;

  return (
    <div style={{ maxWidth: '1240px', margin: '24px auto 60px', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span className="brand-pill" style={{ marginBottom: '8px', display: 'inline-block' }}>
            BATCH OPERATIONS & VIEW COVERAGE
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--text-ink)', margin: '0 0 6px 0' }}>
            Batch Processing & Angle Coverage
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '640px' }}>
            Perform bulk operations: upload multi-angle images, run Gemini AI view grouping, generate multi-format catalogue copy, and sign off on low-risk items.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-editorial-primary"
            onClick={onOpenUpload}
            style={{ padding: '10px 18px', fontSize: '0.84rem' }}
          >
            📤 Upload Images (Max 20)
          </button>
          <button
            type="button"
            className="btn-editorial-secondary"
            onClick={onOpenGroupingStudio}
            style={{ padding: '10px 18px', fontSize: '0.84rem' }}
          >
            🖼️ AI Multi-Image Grouping
          </button>
          <button
            type="button"
            className="btn-editorial-secondary"
            onClick={onGenerateAllMultiFormat}
            disabled={isBatchGenerating}
            style={{ padding: '10px 18px', fontSize: '0.84rem' }}
          >
            {isBatchGenerating ? '⏳ Generating Copy...' : '⚡ Generate Multi-Format Copy'}
          </button>
          <button
            type="button"
            className="btn-editorial-secondary"
            onClick={onApproveLowRisk}
            style={{ padding: '10px 18px', fontSize: '0.84rem' }}
          >
            🛡️ Approve Low-Risk Items
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', padding: '20px', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Items in Batch
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-ink)', marginTop: '4px' }}>
            {totalProducts}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Reference & uploaded products
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', padding: '20px', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Multi-View Products
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', marginTop: '4px' }}>
            {multiImageProducts}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            With &gt;1 visual orientation
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', padding: '20px', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Publication Ready
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--emerald)', marginTop: '4px' }}>
            {readyProducts} / {totalProducts}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Score ≥ 80% with 0 claim flags
          </div>
        </div>
      </div>

      {/* Batch Products Table */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-ink)' }}>
            Batch Items Queue ({products.length})
          </span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Click an item to open in Review Studio
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-card-subtle)', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>Product</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Price</th>
                <th style={{ padding: '12px 16px' }}>Images / Views</th>
                <th style={{ padding: '12px 16px' }}>View Coverage</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Readiness Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const readiness = computeClientReadinessScore ? computeClientReadinessScore(p) : { score: 85, status: 'READY' };
                const coverage = computeClientViewCoverage ? computeClientViewCoverage(p.category, p.images) : { score: 100 };
                const imgCount = p.images?.length || 1;

                return (
                  <tr
                    key={p.product_id}
                    style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.15s ease', cursor: 'pointer' }}
                    onClick={() => onSelectProduct && onSelectProduct(p.product_id)}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.metadata_title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-ink)' }}>{p.metadata_title || p.product_id}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.product_id}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {p.detected_category || p.category || 'General'}
                    </td>

                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--emerald)' }}>
                      ${p.price !== undefined ? Number(p.price).toFixed(2) : '0.00'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', padding: '2px 8px', borderRadius: '999px', background: imgCount > 1 ? 'rgba(79, 70, 229, 0.1)' : 'var(--surface-card-subtle)', color: imgCount > 1 ? 'var(--accent-indigo)' : 'var(--text-secondary)' }}>
                        {imgCount} view{imgCount > 1 ? 's' : ''}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, maxWidth: '80px', height: '6px', background: 'var(--surface-border)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${coverage.score || 75}%`, height: '100%', background: (coverage.score || 75) >= 75 ? 'var(--emerald)' : 'var(--amber)', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {coverage.score || 75}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: p.status === 'APPROVED' ? 'rgba(5, 150, 105, 0.12)' : p.status === 'INACCESSIBLE' ? 'rgba(220, 38, 38, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: p.status === 'APPROVED' ? 'var(--emerald)' : p.status === 'INACCESSIBLE' ? 'var(--rose)' : 'var(--amber)',
                      }}>
                        {p.status || 'PENDING'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: (readiness.score || 70) >= 80 ? 'var(--emerald)' : 'var(--text-ink)' }}>
                        {readiness.score || 70} / 100
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-editorial-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectProduct) onSelectProduct(p.product_id);
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.74rem' }}
                      >
                        Review Studio ↗
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
