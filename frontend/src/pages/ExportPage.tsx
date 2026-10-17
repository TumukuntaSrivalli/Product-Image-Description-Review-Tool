import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchExportJson, getExportCsvUrl } from '../lib/api'
import { AmazonNavbar } from '../components/navigation/AmazonNavbar'
import { SiteFooter } from '../components/common/SiteFooter'

export function ExportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['exportJson'],
    queryFn: fetchExportJson,
  })

  const records = data?.exported_records || []
  const approvedCount = records.filter((r) => r.status === 'approved').length
  const flaggedCount = records.filter((r) => r.status === 'flagged_inaccessible').length
  const pendingCount = records.length - approvedCount - flaggedCount

  const handleDownloadJson = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'varnx-export.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Downloaded varnx-export.json')
  }

  return (
    <div className="app-container">
      <AmazonNavbar reviewedCount={approvedCount} totalCount={records.length || 10} />

      <main className="page-shell" id="main-content">
        <header style={{ marginBottom: '28px' }}>
          <p className="section-eyebrow">Export Studio & Publishing</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', margin: '4px 0 12px 0' }}>
            Production Catalog Export
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '720px' }}>
            Generate sanitized, UTF-8 BOM encoded CSV and structured JSON records containing verified product descriptions,
            transparency flags, and human-in-the-loop audit logs.
          </p>
        </header>

        {/* Readiness Checklist Card */}
        <section
          style={{
            background: 'var(--panel-card)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
          aria-label="Catalogue Readiness Summary"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>Catalogue Readiness Status</h3>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.88rem' }}>
                <span>Total Items: <strong>{records.length || 10}</strong></span>
                <span style={{ color: 'var(--emerald)' }}>Approved: <strong>{approvedCount}</strong></span>
                <span style={{ color: 'var(--amber)' }}>Pending Review: <strong>{pendingCount}</strong></span>
                <span style={{ color: 'var(--rose)' }}>Flagged Inaccessible: <strong>{flaggedCount}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href={getExportCsvUrl()}
                download="varnx-export.csv"
                className="btn-amazon-primary"
                style={{ textDecoration: 'none' }}
                onClick={() => toast.success('Downloaded varnx-export.csv (UTF-8 with BOM)')}
              >
                📥 Download CSV (UTF-8 BOM)
              </a>
              <button
                type="button"
                className="btn-amazon-secondary"
                onClick={handleDownloadJson}
              >
                📥 Download JSON
              </button>
            </div>
          </div>
        </section>

        {/* Summary Table of All 10 Products */}
        <section aria-label="10 Products Summary Table">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>All 10 Catalog Records</h3>
          <div className="export-table-container">
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                Loading export records...
              </div>
            ) : (
              <table className="export-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Final Description</th>
                    <th>Status</th>
                    <th>Edited By Human</th>
                    <th>Source Label</th>
                    <th>Flags / Uncertainties</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec.product_id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--amazon-gold)' }}>
                        {rec.product_id}
                      </td>
                      <td style={{ maxWidth: '340px' }}>
                        {rec.final_description || (
                          <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                            (Empty / Decorative)
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            background:
                              rec.status === 'approved'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : rec.status === 'flagged_inaccessible'
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              rec.status === 'approved'
                                ? 'var(--emerald)'
                                : rec.status === 'flagged_inaccessible'
                                ? 'var(--rose)'
                                : 'var(--amber)',
                          }}
                        >
                          {rec.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {rec.edited_by_human === 'true' ? '✓ true' : 'false'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {rec.source_label}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#D97706' }}>
                        {rec.flags || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Mandatory Honest Disclaimer Note */}
        <section className="compliance-disclaimer-box" role="note">
          <div className="disclaimer-icon">⚠️</div>
          <div className="disclaimer-text">
            <strong>Mandatory Transparency & Legal Notice:</strong> This tool alone does NOT prove site accessibility
            compliance or legal WCAG/ADA certification. Accurate image descriptions (alt text) are one critical component
            of accessible digital commerce, but automated systems and editorial workflows cannot guarantee overall website
            compliance. Always conduct holistic assistive technology testing with screen-reader users and accessibility specialists.
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
