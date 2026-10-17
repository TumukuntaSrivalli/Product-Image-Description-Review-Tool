import React, { useState, useEffect } from 'react';
import './App.css';

// Authoritative fallback fixture data for Case C04 (P01 - P10)
const DEFAULT_PRODUCTS = [
  { product_id: 'P01', metadata_title: 'Blue Tshirt', visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P02', metadata_title: 'Blue Tshirt', visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P03', metadata_title: 'Red Tshirt', visible_description: 'Red rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P04', metadata_title: 'Blue Tshirt', visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P05', metadata_title: 'Blue Mug', visible_description: 'Blue rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P06', metadata_title: 'Red Mug', visible_description: 'Red rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P07', metadata_title: 'Black Mouse', visible_description: 'Black rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P08', metadata_title: 'Black Keyboard', visible_description: 'Black rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P09', metadata_title: 'Grey Hub', visible_description: 'Grey rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
  { product_id: 'P10', metadata_title: 'Green Bottle', visible_description: 'Green rounded rectangular product illustration', review_note: 'This is a synthetic illustration; title and product type are metadata, not proof of visible material or performance.' },
];

export default function App() {
  const [products, setProducts] = useState(() =>
    DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      description: '',
      status: 'Not Generated', // Not Generated | Generated | Edited | Approved | Inaccessible
      imageError: false,
    }))
  );

  const [selectedId, setSelectedId] = useState('P01');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch authoritative fixture from backend on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.images) && data.images.length > 0) {
          setProducts((prev) =>
            data.images.slice(0, 10).map((img, i) => {
              const existing = prev.find((p) => p.product_id === img.product_id) || prev[i] || {};
              return {
                ...img,
                description: existing.description || '',
                status: existing.status || 'Not Generated',
                imageError: false,
              };
            })
          );
        }
      })
      .catch(() => {
        // Fallback uses DEFAULT_PRODUCTS already initialized
      });
  }, []);

  const currentProduct = products.find((p) => p.product_id === selectedId) || products[0];

  // Clear messages after 4 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const t = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [errorMessage, successMessage]);

  // Handle Generate Description via Gemini API
  const handleGenerate = async () => {
    if (!currentProduct) return;
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentProduct.product_id,
          metadataTitle: currentProduct.metadata_title,
          visibleDescription: currentProduct.visible_description,
          reviewNote: currentProduct.review_note,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'AI generation service unavailable. Please check backend connection.');
      }

      const data = await response.json();
      const generatedDraft = data.description || '';

      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === currentProduct.product_id
            ? {
                ...p,
                description: generatedDraft,
                status: 'Generated',
              }
            : p
        )
      );
      setSuccessMessage(`Draft generated for ${currentProduct.product_id} via Gemini API.`);
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with AI service. Try again or edit manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Human Edit: never auto-overwrite; mark as Edited
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === currentProduct.product_id
          ? {
              ...p,
              description: val,
              status: p.status === 'Approved' ? 'Edited' : p.status === 'Not Generated' ? 'Edited' : 'Edited',
            }
          : p
      )
    );
  };

  // Approve action
  const handleApprove = () => {
    if (!currentProduct.description.trim()) {
      setErrorMessage('Cannot approve an empty description. Please generate or write a description first.');
      return;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === currentProduct.product_id
          ? {
              ...p,
              status: 'Approved',
            }
          : p
      )
    );
    setSuccessMessage(`Product ${currentProduct.product_id} approved successfully!`);
  };

  // Mark as Inaccessible action
  const handleMarkInaccessible = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === currentProduct.product_id
          ? {
              ...p,
              status: 'Inaccessible',
            }
          : p
      )
    );
    setSuccessMessage(`Marked ${currentProduct.product_id} as Inaccessible. You may proceed to other products.`);
  };

  // Image load error handler
  const handleImageError = () => {
    setProducts((prev) =>
      prev.map((p) => (p.product_id === currentProduct.product_id ? { ...p, imageError: true } : p))
    );
  };

  // CSV escape utility (RFC 4180 safe against commas, quotes, newlines)
  const escapeCsvCell = (str) => {
    const s = String(str ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  // Export Results to CSV
  const handleExportCsv = () => {
    const headers = ['product_id', 'description', 'status'];
    const rows = products.slice(0, 10).map((p) => {
      let finalDesc = p.description.trim();
      if (p.status === 'Inaccessible' && !finalDesc) {
        finalDesc = '[INACCESSIBLE: Image unreadable or missing]';
      }
      return [
        escapeCsvCell(p.product_id),
        escapeCsvCell(finalDesc),
        escapeCsvCell(p.status),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product_description_review_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMessage('Downloaded product_description_review_results.csv with all 10 products.');
  };

  // Export Results to JSON
  const handleExportJson = () => {
    const payload = {
      case_id: 'C04',
      total: products.length,
      records: products.map((p) => ({
        product_id: p.product_id,
        description: p.description,
        status: p.status,
        metadata_title: p.metadata_title,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'product_description_review_results.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Status badge styling helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Approved':
        return { background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' };
      case 'Generated':
        return { background: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' };
      case 'Edited':
        return { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
      case 'Inaccessible':
        return { background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
      default:
        return { background: '#F3F4F6', color: '#4B5563', border: '1px solid #E5E7EB' };
    }
  };

  const approvedCount = products.filter((p) => p.status === 'Approved').length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="amazon-topbar">
        <div className="amazon-topbar-inner">
          <div className="amazon-brand">
            <div className="amazon-brand-logo"><span>V</span></div>
            <div className="amazon-brand-text">
              <span className="amazon-brand-title">VarnX</span>
              <span className="amazon-brand-subtitle">Product Description Review (Fynd × NMIMS C04)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.86rem', color: '#DDD' }}>
              Reviewed: <strong style={{ color: '#FF9900' }}>{approvedCount} / 10</strong> Approved
            </span>
            <button
              type="button"
              className="btn-amazon-primary"
              onClick={handleExportCsv}
              style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.84rem' }}
            >
              📥 Export Results (CSV)
            </button>
            <button
              type="button"
              className="btn-amazon-secondary"
              onClick={handleExportJson}
              style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.84rem' }}
            >
              Export JSON
            </button>
          </div>
        </div>
      </header>

      {/* Main Review Workspace */}
      <main className="page-shell workspace-page">
        {/* User Alert Messages */}
        {errorMessage && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontWeight: 600 }} role="alert">
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #34D399', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontWeight: 600 }} role="status">
            ✓ {successMessage}
          </div>
        )}

        <div className="workspace-grid">
          {/* Left Filmstrip Navigation (P01 - P10) */}
          <aside className="filmstrip-panel" aria-label="Product Navigation">
            <div className="filmstrip-header">
              <span>Catalog Queue (10)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map((p) => {
                const isSelected = p.product_id === selectedId;
                return (
                  <button
                    key={p.product_id}
                    type="button"
                    className={`filmstrip-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedId(p.product_id)}
                  >
                    <div style={{ width: '42px', height: '42px', background: '#FFF', borderRadius: '6px', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                      <img
                        src={`/assets/${p.product_id}.png`}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div className="filmstrip-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="filmstrip-id">{p.product_id}</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            ...getStatusBadgeStyle(p.status),
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="filmstrip-title">{p.metadata_title}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Center Product Image Viewer */}
          <section className="viewer-panel" aria-label="Product Image View">
            <div className="viewer-toolbar">
              <div className="viewer-asin-meta">
                <span className="asin-tag">SKU: {currentProduct.product_id}</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{currentProduct.metadata_title}</span>
              </div>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  ...getStatusBadgeStyle(currentProduct.status),
                }}
              >
                Status: {currentProduct.status}
              </span>
            </div>

            <div className="viewer-image-stage">
              {currentProduct.imageError ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#991B1B' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️ 🖼️</div>
                  <h4 style={{ margin: '0 0 6px 0' }}>Image Failed to Load</h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '14px' }}>
                    The asset file for {currentProduct.product_id} is missing or corrupted.
                  </p>
                  <button
                    type="button"
                    className="btn-outline-danger"
                    onClick={handleMarkInaccessible}
                  >
                    🚩 Mark as Inaccessible
                  </button>
                </div>
              ) : (
                <img
                  src={`/assets/${currentProduct.product_id}.png`}
                  alt={currentProduct.description || currentProduct.visible_description}
                  className="viewer-main-image"
                  onError={handleImageError}
                />
              )}
            </div>

            <div className="viewer-metadata-box">
              <span className="metadata-warning-chip">
                ⚠️ Metadata Title: "{currentProduct.metadata_title}" (Metadata is NOT proof of material, brand, or performance)
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '6px 0 0 0' }}>
                <strong>Observable details:</strong> {currentProduct.visible_description}
              </p>
            </div>
          </section>

          {/* Right Review & Editorial Panel */}
          <aside className="editor-panel" aria-label="Review and Editorial Controls">
            <div className="editor-section-title">
              <span>Image Description (Alt Text)</span>
              <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {currentProduct.description.length} chars
              </span>
            </div>

            {/* Generate Description Button */}
            <div>
              <button
                type="button"
                className="btn-amazon-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{ width: '100%', minHeight: '44px' }}
              >
                {isGenerating ? '⚡ Generating description...' : '✨ Generate Description (Gemini AI)'}
              </button>
              <div style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'center' }}>
                C04 Strict Rules: Observable details only. No fake materials or certifications.
              </div>
            </div>

            {/* Editable Description Textarea */}
            <div className="textarea-wrapper">
              <label htmlFor="alt-text-editor" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                Review / Edit Description:
              </label>
              <textarea
                id="alt-text-editor"
                className="editor-textarea"
                rows={5}
                placeholder="Click 'Generate Description' or write observable visual details here..."
                value={currentProduct.description}
                onChange={handleDescriptionChange}
              />
            </div>

            {/* Action Buttons: Approve & Mark Inaccessible */}
            <div className="action-buttons-row">
              <button
                type="button"
                className="btn-amazon-primary"
                onClick={handleApprove}
                disabled={isGenerating}
                style={{ background: 'linear-gradient(to bottom, #10B981, #059669)', borderColor: '#047857', color: '#FFF' }}
              >
                ✓ Approve Description
              </button>

              <div className="action-buttons-subrow">
                <button
                  type="button"
                  className="btn-outline-danger"
                  onClick={handleMarkInaccessible}
                >
                  🚩 Mark as Inaccessible
                </button>
                <button
                  type="button"
                  className="btn-amazon-secondary"
                  onClick={() => {
                    setProducts((prev) =>
                      prev.map((p) =>
                        p.product_id === currentProduct.product_id
                          ? { ...p, description: '', status: 'Not Generated' }
                          : p
                      )
                    );
                  }}
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            {/* Guidance Note */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              <strong>Workflow:</strong> Generate → Read → Edit → Approve. Switching between products preserves descriptions and statuses.
            </div>
          </aside>
        </div>
      </main>

      {/* Honest Disclaimer Footer */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div style={{ fontSize: '0.78rem', color: '#999', maxWidth: '800px' }}>
            <strong>Case C04 Prototype Notice:</strong> Operating on synthetic fixture dataset C04 (P01–P10).
            This tool alone does NOT prove site accessibility compliance.
          </div>
          <div style={{ fontSize: '0.8rem', color: '#FF9900' }}>
            Fynd × NMIMS Hyderabad
          </div>
        </div>
      </footer>
    </div>
  );
}
