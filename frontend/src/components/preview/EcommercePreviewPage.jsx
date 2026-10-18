import React, { useState } from 'react';

export function EcommercePreviewPage({
  products = [],
  selectedId,
  onSelectProduct,
  onNavigate,
  ecommerceUrls = {},
  onUpdateEcommerceUrl,
  setSuccessMessage,
}) {
  const currentProduct = products.find((p) => p.product_id === selectedId) || products[0] || null;

  const currentUrl = currentProduct
    ? (ecommerceUrls[currentProduct.product_id] ?? currentProduct.ecommerce_url ?? '')
    : '';

  const [urlInput, setUrlInput] = useState(currentUrl);

  // Sync urlInput when currentProduct changes
  React.useEffect(() => {
    setUrlInput(currentUrl);
  }, [currentProduct?.product_id, currentUrl]);

  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrlInput(val);
    if (currentProduct) {
      onUpdateEcommerceUrl(currentProduct.product_id, val);
    }
  };

  const isApproved = Boolean(
    currentProduct &&
    currentProduct.status === 'APPROVED' &&
    currentProduct.final_description &&
    currentProduct.final_description.trim().length > 0
  );

  const handleOpenStore = () => {
    const trimmed = (urlInput || '').trim();
    if (!trimmed) return;
    const finalUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyDescription = () => {
    if (!currentProduct?.final_description) return;
    navigator.clipboard.writeText(currentProduct.final_description);
    if (setSuccessMessage) {
      setSuccessMessage('Approved description copied to clipboard!');
    }
  };

  // Derive only verified highlights
  const highlights = React.useMemo(() => {
    if (!currentProduct) return [];
    if (Array.isArray(currentProduct.product_highlights) && currentProduct.product_highlights.length > 0) {
      return currentProduct.product_highlights.filter(Boolean);
    }
    if (Array.isArray(currentProduct.selected_highlights) && currentProduct.selected_highlights.length > 0) {
      return currentProduct.selected_highlights.filter(Boolean);
    }
    // Fallback only to observable category / visual attributes
    const fallback = [];
    if (currentProduct.category) fallback.push(`Category: ${currentProduct.category}`);
    if (currentProduct.visible_description && currentProduct.visible_description !== 'Merchant batch uploaded product') {
      fallback.push(`Visual detail: ${currentProduct.visible_description}`);
    }
    return fallback;
  }, [currentProduct]);

  const productName = currentProduct?.metadata_title || currentProduct?.title || `Product ${currentProduct?.product_id || ''}`;
  const productPrice = typeof currentProduct?.price === 'number'
    ? `$${currentProduct.price.toFixed(2)}`
    : '$39.99';

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto 60px', padding: '0 20px', fontFamily: 'var(--font-sans, sans-serif)' }}>
      {/* Workflow Navigation Indicator */}
      <nav aria-label="Product Workflow Steps" style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          padding: '12px 16px',
          background: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          fontSize: '0.78rem',
          fontWeight: 600,
        }}>
          {[
            { label: 'Upload', step: 'upload', done: true, targetTab: 'workspace' },
            { label: 'Analyze', step: 'analyze', done: true, targetTab: 'workspace' },
            { label: 'Generate', step: 'generate', done: true, targetTab: 'workspace' },
            { label: 'Review & Edit', step: 'review', done: true, targetTab: 'workspace' },
            { label: 'Approve', step: 'approve', done: isApproved, targetTab: 'workspace' },
            { label: 'Results', step: 'results', done: isApproved, targetTab: 'export' },
            { label: 'Ecommerce Preview', step: 'preview', active: true, targetTab: 'preview' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.label}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate(item.targetTab)}
                style={{
                  background: item.active
                    ? '#2563EB'
                    : item.done
                    ? '#EFF6FF'
                    : '#F1F5F9',
                  color: item.active
                    ? '#FFFFFF'
                    : item.done
                    ? '#1D4ED8'
                    : '#64748B',
                  border: item.active
                    ? '1px solid #1D4ED8'
                    : item.done
                    ? '1px solid #BFDBFE'
                    : '1px solid #E2E8F0',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.76rem',
                  fontWeight: item.active ? 700 : 600,
                  transition: 'all 0.15s ease',
                }}
                title={`Go to ${item.label}`}
              >
                {item.done && !item.active && <span>✓</span>}
                {item.active && <span>●</span>}
                <span>{item.label}</span>
              </button>
              {idx < arr.length - 1 && (
                <span style={{ color: '#94A3B8', fontSize: '0.75rem', userSelect: 'none' }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Page Title & Simple Purpose Message */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '3px 9px',
              borderRadius: '999px',
              background: '#EFF6FF',
              color: '#1D4ED8',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              border: '1px solid #BFDBFE',
            }}>
              ✦ Ecommerce Storefront Preview
            </span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Ecommerce Product Listing Preview
            </h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#475569', maxWidth: '720px' }}>
              Your approved AI-generated product description is ready to be used on an ecommerce product page.
            </p>
          </div>

          {/* Product Switcher if multiple products exist */}
          {products.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Product:</span>
              <select
                value={currentProduct?.product_id || ''}
                onChange={(e) => onSelectProduct && onSelectProduct(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#0F172A',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_id} — {p.metadata_title || p.title || 'Untitled'} ({p.status === 'APPROVED' ? 'Approved' : 'Pending'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT CARD: Clean, Minimal Ecommerce Product Listing */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
      }}>
        {/* Top Product Meta Bar */}
        <div style={{
          padding: '14px 24px',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
            }}>
              {currentProduct?.product_id || 'ID'}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              {currentProduct?.category || 'General'}
            </span>
          </div>

          <div>
            {isApproved ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#ECFDF5',
                color: '#059669',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: '1px solid #A7F3D0',
              }}>
                ✓ Approved & Ready for Store
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#FFFBEB',
                color: '#D97706',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: '1px solid #FDE68A',
              }}>
                ⚠️ Approval Pending
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Product Card Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 420px) 1fr',
          gap: '32px',
          padding: '32px 28px',
        }}>
          {/* Left: Product Image Card */}
          <div>
            <div style={{
              position: 'relative',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '360px',
              maxHeight: '460px',
            }}>
              {currentProduct?.image_url ? (
                <img
                  src={currentProduct.image_url}
                  alt={productName}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '440px',
                    objectFit: 'contain',
                    padding: '16px',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🖼️</div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>No Product Image Available</div>
                </div>
              )}

              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(4px)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#334155',
                border: '1px solid #E2E8F0',
              }}>
                Verified Image
              </div>
            </div>

            {/* Price & Stock Tag under Image */}
            <div style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', fontWeight: 600 }}>Listing Price</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{productPrice}</span>
              </div>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                ● In Stock
              </span>
            </div>
          </div>

          {/* Right: Product Details & Ecommerce Integration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title & Brand */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                Storefront Listing
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', lineHeight: 1.25 }}>
                {productName}
              </h2>
            </div>

            {/* Approved Product Description */}
            <div style={{
              background: isApproved ? '#FFFFFF' : '#FFFBEB',
              borderRadius: '10px',
              border: isApproved ? '1px solid #E2E8F0' : '1px solid #FDE68A',
              padding: '18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Product Description
                </span>
                {isApproved && (
                  <button
                    type="button"
                    onClick={handleCopyDescription}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1D4ED8',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Copy approved text"
                  >
                    📋 Copy Text
                  </button>
                )}
              </div>

              {isApproved ? (
                <div style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.7,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                }}>
                  {currentProduct.final_description}
                </div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  <div style={{
                    color: '#B45309',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <span>⚠️</span>
                    <span>Approve the description before publishing.</span>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: '#78350F', lineHeight: 1.5 }}>
                    This item has not yet received human editorial approval. In accordance with platform quality standards, unapproved AI drafts are not displayed on public ecommerce storefronts.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('workspace')}
                    style={{
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✍️ Open Review Studio to Approve
                  </button>
                </div>
              )}
            </div>

            {/* Product Highlights Section */}
            {highlights.length > 0 && (
              <div style={{
                background: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '16px 18px',
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
                  Product Highlights
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {highlights.map((h, i) => (
                    <li key={i} style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ecommerce Storefront Connection Link */}
            <div style={{
              background: '#F0F9FF',
              borderRadius: '12px',
              border: '1px solid #BAE6FD',
              padding: '18px 20px',
              marginTop: 'auto',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="ecommerce-url-input"
                  style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#0369A1', marginBottom: '4px' }}
                >
                  Ecommerce Product URL
                </label>
                <p style={{ margin: 0, fontSize: '0.76rem', color: '#0284C7' }}>
                  Configure the destination product URL on Shopify, WooCommerce, Amazon, or your custom store.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  id="ecommerce-url-input"
                  type="url"
                  value={urlInput}
                  onChange={handleUrlChange}
                  placeholder="https://yourstore.com/products/example-item"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #7DD3FC',
                    background: '#FFFFFF',
                    fontSize: '0.86rem',
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleOpenStore}
                    disabled={!urlInput || !urlInput.trim()}
                    style={{
                      background: urlInput && urlInput.trim() ? '#0284C7' : '#94A3B8',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: urlInput && urlInput.trim() ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background 0.15s ease',
                    }}
                    title={urlInput && urlInput.trim() ? 'Open product URL in new tab' : 'Provide a URL to view'}
                  >
                    <span>View on Ecommerce Store</span>
                    <span>↗</span>
                  </button>

                  {(!urlInput || !urlInput.trim()) && (
                    <span style={{ fontSize: '0.74rem', color: '#0369A1', fontStyle: 'italic' }}>
                      Enter a URL to enable the live store view button
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
