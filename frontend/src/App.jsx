import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Authoritative fallback fixture data for Case C04 (P01 - P10)
const DEFAULT_PRODUCTS = [
  { product_id: 'P01', metadata_title: 'Blue Tshirt', category: 'Apparel', visible_description: 'Blue rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P02', metadata_title: 'Blue Tshirt', category: 'Apparel', visible_description: 'Blue rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P03', metadata_title: 'Red Tshirt', category: 'Apparel', visible_description: 'Red rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P04', metadata_title: 'Blue Tshirt', category: 'Apparel', visible_description: 'Blue rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P05', metadata_title: 'Blue Mug', category: 'Drinkware', visible_description: 'Blue rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P06', metadata_title: 'Red Mug', category: 'Drinkware', visible_description: 'Red rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P07', metadata_title: 'Black Mouse', category: 'Electronics', visible_description: 'Black rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P08', metadata_title: 'Black Keyboard', category: 'Electronics', visible_description: 'Black rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P09', metadata_title: 'Grey Hub', category: 'Accessories', visible_description: 'Grey rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
  { product_id: 'P10', metadata_title: 'Green Bottle', category: 'Drinkware', visible_description: 'Green rounded rectangular product illustration', review_note: 'Synthetic illustration; metadata is not proof of material or performance.' },
];

export default function App() {
  const [products, setProducts] = useState(() =>
    DEFAULT_PRODUCTS.map((p) => ({
      ...p,
      image_url: `/assets/${p.product_id}.png`,
      file_name: `${p.product_id}.png`,
      detected_features: [],
      selected_feature_ids: [],
      description: '',
      status: 'Not Generated', // Not Generated | Generated | Edited | Approved | Inaccessible
      imageError: false,
      isUploaded: false,
    }))
  );

  const [selectedId, setSelectedId] = useState('P01');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Custom Feature inline form
  const [showCustomFeatureForm, setShowCustomFeatureForm] = useState(false);
  const [customFeatureName, setCustomFeatureName] = useState('');
  const [customFeatureValue, setCustomFeatureValue] = useState('');

  // Upload counter ref
  const uploadCounterRef = useRef(1);
  const fileInputRef = useRef(null);

  // Fetch authoritative fixture from backend on mount
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.images) && data.images.length > 0) {
          setProducts((prev) => {
            const demoProducts = data.images.slice(0, 10).map((img, i) => {
              const existing = prev.find((p) => p.product_id === img.product_id) || prev[i] || {};
              return {
                ...img,
                category: existing.category || 'General',
                image_url: `/assets/${img.product_id}.png`,
                file_name: `${img.product_id}.png`,
                detected_features: existing.detected_features || [],
                selected_feature_ids: existing.selected_feature_ids || [],
                description: existing.description || '',
                status: existing.status || 'Not Generated',
                imageError: false,
                isUploaded: false,
              };
            });
            // Keep existing uploaded products intact
            const uploadedProducts = prev.filter((p) => p.isUploaded);
            return [...demoProducts, ...uploadedProducts];
          });
        }
      })
      .catch(() => {
        // Fallback uses DEFAULT_PRODUCTS already initialized
      });
  }, []);

  const currentProduct = products.find((p) => p.product_id === selectedId) || products[0];

  // Auto-clear alert messages
  useEffect(() => {
    if (errorMessage || successMessage) {
      const t = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage, successMessage]);

  // Handler for Merchant File Upload (PNG/JPG/JPEG/WEBP)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      const formattedNum = String(uploadCounterRef.current).padStart(3, '0');
      const newId = `UPLOAD-${formattedNum}`;
      uploadCounterRef.current += 1;

      const newUploadedProduct = {
        product_id: newId,
        metadata_title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        category: 'Merchant Item',
        visible_description: 'Merchant uploaded product image',
        review_note: 'Merchant image upload; review observable features before generation.',
        image_url: base64Data,
        file_name: file.name,
        detected_features: [],
        selected_feature_ids: [],
        description: '',
        status: 'Not Generated',
        imageError: false,
        isUploaded: true,
      };

      setProducts((prev) => [...prev, newUploadedProduct]);
      setSelectedId(newId);
      setSuccessMessage(`Loaded image ${file.name} as ${newId}. Click "Analyze Image" to detect features.`);
    };

    reader.onerror = () => {
      setErrorMessage('Failed to read the selected image file. Please try another image.');
    };

    reader.readAsDataURL(file);
    // Reset file input so same file can be re-uploaded if needed
    e.target.value = '';
  };

  // Replace current image (for uploaded product)
  const handleReplaceImage = (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentProduct) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result;
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === currentProduct.product_id
            ? {
                ...p,
                image_url: base64Data,
                file_name: file.name,
                imageError: false,
                detected_features: [],
                selected_feature_ids: [],
                status: p.status === 'Approved' ? 'Edited' : p.status,
              }
            : p
        )
      );
      setSuccessMessage(`Replaced image for ${currentProduct.product_id}. Run "Analyze Image" to update features.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Remove uploaded product
  const handleRemoveProduct = (productId) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.product_id !== productId);
      return updated.length > 0 ? updated : prev;
    });
    if (selectedId === productId) {
      setSelectedId('P01');
    }
    setSuccessMessage(`Removed ${productId} from session queue.`);
  };

  // Update metadata fields (Product Name / Category)
  const handleMetadataChange = (field, value) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === currentProduct.product_id ? { ...p, [field]: value } : p
      )
    );
  };

  // POST /analyze-image - Dynamic visual feature extraction
  const handleAnalyzeImage = async () => {
    if (!currentProduct) return;
    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentProduct.image_url,
          productId: currentProduct.product_id,
          productName: currentProduct.metadata_title,
          category: currentProduct.category,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to analyze product image.');
      }

      const data = await response.json();
      const features = data.features || [];

      if (features.length === 0) {
        throw new Error('No distinct visual features were detected. Try adding custom features manually.');
      }

      // Automatically select all detected features initially
      const featureIds = features.map((f) => f.id);

      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === currentProduct.product_id
            ? {
                ...p,
                detected_features: features,
                selected_feature_ids: featureIds,
              }
            : p
        )
      );

      setSuccessMessage(`Detected ${features.length} visual features for ${currentProduct.product_id}. Review and select which ones to highlight.`);
    } catch (err) {
      setErrorMessage(err.message || 'Image analysis service encountered an error. You may add features manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle selection of a feature
  const handleToggleFeature = (featureId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        const exists = p.selected_feature_ids.includes(featureId);
        const newSelected = exists
          ? p.selected_feature_ids.filter((id) => id !== featureId)
          : [...p.selected_feature_ids, featureId];
        return {
          ...p,
          selected_feature_ids: newSelected,
        };
      })
    );
  };

  // Add Custom Feature
  const handleAddCustomFeature = (e) => {
    e.preventDefault();
    if (!customFeatureName.trim() || !customFeatureValue.trim()) {
      setErrorMessage('Please specify both a feature name and visible trait value.');
      return;
    }

    const newFeature = {
      id: `custom-${Date.now()}`,
      name: customFeatureName.trim(),
      value: customFeatureValue.trim(),
      confidence: 'custom',
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.product_id !== currentProduct.product_id) return p;
        return {
          ...p,
          detected_features: [...p.detected_features, newFeature],
          selected_feature_ids: [...p.selected_feature_ids, newFeature.id],
        };
      })
    );

    setCustomFeatureName('');
    setCustomFeatureValue('');
    setShowCustomFeatureForm(false);
    setSuccessMessage(`Added custom feature "${newFeature.name}" to highlight selection.`);
  };

  // POST /generate-description - Drive generation strictly by selected features
  const handleGenerate = async () => {
    if (!currentProduct) return;

    // Filter to selected features
    const selectedFeatures = currentProduct.detected_features.filter((f) =>
      currentProduct.selected_feature_ids.includes(f.id)
    );

    if (selectedFeatures.length === 0 && currentProduct.detected_features.length > 0) {
      setErrorMessage('Please select at least one feature to highlight before generating the description.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: currentProduct.product_id,
          productName: currentProduct.metadata_title,
          productType: currentProduct.category,
          image: currentProduct.image_url,
          visibleDescription: currentProduct.visible_description,
          selectedFeatures: selectedFeatures,
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
      setSuccessMessage(`Generated catalogue bullet points for ${currentProduct.product_id}.`);
    } catch (err) {
      setErrorMessage(err.message || 'Error communicating with AI service. Try again or edit manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Human Edit: Never auto-overwrite; marks as Edited
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === currentProduct.product_id
          ? {
              ...p,
              description: val,
              status: 'Edited',
            }
          : p
      )
    );
  };

  // Approve action: block empty, save latest text, mark Approved for this product
  const handleApprove = () => {
    if (!currentProduct.description.trim()) {
      setErrorMessage('Cannot approve an empty description. Please generate or write bullet points first.');
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
    setSuccessMessage(`Product ${currentProduct.product_id} approved for catalogue export!`);
  };

  // Mark as Inaccessible action
  const handleMarkInaccessible = () => {
    setProducts((prev) =>
      prev.map((p) =>
        p.product_id === currentProduct.product_id
          ? {
              ...p,
              description: 'Image unavailable — manual review required.',
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

  // Export Results to CSV (includes all P01-P10 AND all uploaded products)
  const handleExportCsv = () => {
    const headers = ['product_id', 'description', 'status'];
    const rows = products.map((p) => {
      let finalDesc = p.description.trim();
      if (p.status === 'Inaccessible' && !finalDesc) {
        finalDesc = 'Image unavailable — manual review required.';
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
    setSuccessMessage(`Exported product_description_review_results.csv (${products.length} products).`);
  };

  // Export Results to JSON
  const handleExportJson = () => {
    const payload = {
      case_id: 'C04',
      total: products.length,
      demo_count: products.filter((p) => !p.isUploaded).length,
      upload_count: products.filter((p) => p.isUploaded).length,
      records: products.map((p) => ({
        product_id: p.product_id,
        description: p.description,
        status: p.status,
        metadata_title: p.metadata_title,
        category: p.category,
        selected_features_count: p.selected_feature_ids.length,
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

  // Status badge style helper
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
  const demoProducts = products.filter((p) => !p.isUploaded);
  const uploadedProducts = products.filter((p) => p.isUploaded);

  const selectedCount = currentProduct?.selected_feature_ids?.length || 0;
  const totalFeatures = currentProduct?.detected_features?.length || 0;
  const bulletCount = (currentProduct?.description?.match(/^[•\-\*]/gm) || []).length;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="amazon-topbar">
        <div className="amazon-topbar-inner">
          <div className="amazon-brand">
            <div className="amazon-brand-logo"><span>V</span></div>
            <div className="amazon-brand-text">
              <span className="amazon-brand-title">VernX</span>
              <span className="amazon-brand-subtitle">AI Product Description Review (Fynd × NMIMS C04)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.84rem', color: '#DDD' }}>
              Reviewed: <strong style={{ color: '#FF9900' }}>{approvedCount} / {products.length}</strong> Approved
            </span>

            {/* Hidden file input for header upload button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn-amazon-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{ minHeight: '34px', padding: '6px 12px', fontSize: '0.82rem' }}
            >
              📤 Upload Product Image
            </button>

            <button
              type="button"
              className="btn-amazon-primary"
              onClick={handleExportCsv}
              style={{ minHeight: '34px', padding: '6px 12px', fontSize: '0.82rem' }}
            >
              📥 Export Results (CSV)
            </button>
            <button
              type="button"
              className="btn-amazon-secondary"
              onClick={handleExportJson}
              style={{ minHeight: '34px', padding: '6px 12px', fontSize: '0.82rem' }}
            >
              JSON
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
          {/* Left Filmstrip Navigation */}
          <aside className="filmstrip-panel" aria-label="Product Navigation">
            {/* Demo Products Section (P01 - P10) */}
            <div className="filmstrip-header">
              <span>Demo Queue (P01–P10)</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {demoProducts.map((p) => {
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
                        src={p.image_url}
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

            {/* Merchant Uploads Section */}
            <div className="filmstrip-header" style={{ marginTop: '20px' }}>
              <span>Merchant Uploads ({uploadedProducts.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {uploadedProducts.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: '0.78rem', color: 'var(--muted)', background: 'var(--paper)', borderRadius: '6px', border: '1px dashed var(--border)' }}>
                  No uploaded images yet. Click "Upload Product Image" above or below.
                </div>
              ) : (
                uploadedProducts.map((p) => {
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
                          src={p.image_url}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="filmstrip-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="filmstrip-id" style={{ color: '#4F46E5', fontWeight: 800 }}>{p.product_id}</span>
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
                })
              )}
            </div>
          </aside>

          {/* Center Product Image & Feature Extraction Stage */}
          <section className="viewer-panel" aria-label="Product Image View">
            <div className="viewer-toolbar">
              <div className="viewer-asin-meta">
                <span className="asin-tag">SKU: {currentProduct.product_id}</span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{currentProduct.metadata_title}</span>
                {currentProduct.isUploaded && (
                  <span style={{ fontSize: '0.7rem', background: '#EEF2FF', color: '#4338CA', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    Uploaded Asset
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                {currentProduct.isUploaded && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(currentProduct.product_id)}
                    title="Remove this uploaded product"
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>

            {/* Main Image Stage */}
            <div className="viewer-image-stage">
              {currentProduct.imageError ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#991B1B' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️ 🖼️</div>
                  <h4 style={{ margin: '0 0 6px 0' }}>This image is unavailable.</h4>
                  <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginBottom: '14px' }}>
                    Asset for {currentProduct.product_id} is missing, blank, or unreadable.
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
                  src={currentProduct.image_url}
                  alt={currentProduct.description || currentProduct.metadata_title}
                  className="viewer-main-image"
                  onError={handleImageError}
                />
              )}
            </div>

            {/* Upload & Context Controls */}
            {currentProduct.isUploaded && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className="upload-filename-pill">
                    📎 {currentProduct.file_name}
                  </span>
                  <label className="btn-small-action" style={{ cursor: 'pointer' }}>
                    🔄 Replace Image
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      style={{ display: 'none' }}
                      onChange={handleReplaceImage}
                    />
                  </label>
                </div>

                <div className="upload-inputs-row">
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Product Name (Optional):
                    </label>
                    <input
                      type="text"
                      className="upload-input-field"
                      value={currentProduct.metadata_title}
                      placeholder="e.g. Wireless Noise-Cancelling Headphones"
                      onChange={(e) => handleMetadataChange('metadata_title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                      Category (Optional):
                    </label>
                    <input
                      type="text"
                      className="upload-input-field"
                      value={currentProduct.category}
                      placeholder="e.g. Audio, Footwear, Bag, Phone"
                      onChange={(e) => handleMetadataChange('category', e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '6px' }}>
                  * Name and category provide context only; they are never considered proof of visual traits or specs.
                </div>
              </div>
            )}

            {/* Context Note for C04 Demo items */}
            {!currentProduct.isUploaded && (
              <div className="viewer-metadata-box">
                <span className="metadata-warning-chip">
                  ⚠️ Metadata Title: "{currentProduct.metadata_title}" (Metadata is NOT proof of material, brand, or performance)
                </span>
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '6px 0 0 0' }}>
                  <strong>Authoritative reference:</strong> {currentProduct.visible_description}
                </p>
              </div>
            )}

            {/* Quick Review UI: Which features should we highlight? */}
            <div className="features-review-container">
              <div className="features-review-header">
                <div>
                  <div className="features-review-title">
                    <span>✨ AI Detected Features</span>
                    {totalFeatures > 0 && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>
                        ({selectedCount} of {totalFeatures} highlighted)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Which features should we highlight? The AI assists; the merchant decides.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-amazon-primary"
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing || currentProduct.imageError}
                    style={{ minHeight: '36px', padding: '6px 14px', fontSize: '0.82rem' }}
                  >
                    {isAnalyzing ? '🔍 Analyzing image...' : totalFeatures > 0 ? '🔄 Re-Analyze' : '🔍 Analyze Image'}
                  </button>
                  <button
                    type="button"
                    className="btn-small-action"
                    onClick={() => setShowCustomFeatureForm(!showCustomFeatureForm)}
                    style={{ minHeight: '36px' }}
                  >
                    + Add Custom Feature
                  </button>
                </div>
              </div>

              {/* Inline Custom Feature Form */}
              {showCustomFeatureForm && (
                <form onSubmit={handleAddCustomFeature} className="custom-feature-box">
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '8px' }}>
                    Add Custom Feature (Merchant Provided):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="upload-input-field"
                      placeholder="Feature Name (e.g. Matte Finish)"
                      value={customFeatureName}
                      onChange={(e) => setCustomFeatureName(e.target.value)}
                    />
                    <input
                      type="text"
                      className="upload-input-field"
                      placeholder="Observable Trait (e.g. Dark non-reflective coating)"
                      value={customFeatureValue}
                      onChange={(e) => setCustomFeatureValue(e.target.value)}
                    />
                    <button type="submit" className="btn-amazon-primary" style={{ minHeight: '34px', padding: '6px 12px', fontSize: '0.8rem' }}>
                      Add
                    </button>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '4px' }}>
                    * Custom features are marked as merchant-supplied and never auto-trusted.
                  </div>
                </form>
              )}

              {/* Dynamic Feature Cards Grid */}
              {totalFeatures === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--paper)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)' }}>
                    Click <strong>"Analyze Image"</strong> to detect dynamic visual features from this product's photo.
                  </p>
                </div>
              ) : (
                <div className="features-grid">
                  {currentProduct.detected_features.map((feat) => {
                    const isSelected = currentProduct.selected_feature_ids.includes(feat.id);
                    return (
                      <div
                        key={feat.id}
                        className={`feature-item-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleFeature(feat.id)}
                      >
                        <input
                          type="checkbox"
                          className="feature-checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled via card click
                          aria-label={`Highlight feature ${feat.name}`}
                        />
                        <div className="feature-content">
                          <div className="feature-title-row">
                            <span className="feature-name">{feat.name}</span>
                            <span className={`confidence-chip confidence-${feat.confidence}`}>
                              {feat.confidence === 'high' ? 'High' : feat.confidence === 'medium' ? 'Medium' : feat.confidence === 'low' ? 'Low' : 'Custom'}
                            </span>
                          </div>
                          <div className="feature-value">
                            {feat.confidence === 'medium' || feat.confidence === 'low'
                              ? feat.value.startsWith('Possible') ? feat.value : `Possible ${feat.value}`
                              : feat.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Right Review Description & Editorial Panel */}
          <aside className="editor-panel" aria-label="Review and Editorial Controls">
            <div className="editor-section-title">
              <span>Review Description (Catalogue Bullets)</span>
              <span style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {bulletCount} {bulletCount === 1 ? 'bullet' : 'bullets'} • {currentProduct.description.length} chars
              </span>
            </div>

            {/* Generate Description Button */}
            <div>
              <button
                type="button"
                className="btn-amazon-primary"
                onClick={handleGenerate}
                disabled={isGenerating || currentProduct.imageError}
                style={{ width: '100%', minHeight: '44px' }}
              >
                {isGenerating
                  ? '⚡ Generating description...'
                  : totalFeatures > 0
                  ? `✨ Generate Description (${selectedCount} Features)`
                  : '✨ Generate Description (Gemini AI)'}
              </button>
              <div style={{ fontSize: '0.73rem', color: 'var(--muted)', marginTop: '4px', textAlign: 'center' }}>
                Only selected features drive the output. No unsupported claims or banned hype phrases.
              </div>
            </div>

            {/* Review Description Bullet Editor */}
            <div className="textarea-wrapper">
              <label htmlFor="alt-text-editor" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                Review / Edit Bullet Points:
              </label>
              <textarea
                id="alt-text-editor"
                className="editor-textarea-bullets"
                rows={8}
                placeholder="• Select features above and click 'Generate Description'&#10;• Human editor may add, reword, or adjust bullets freely&#10;• Positivity comes from observable traits, not invented specs"
                value={currentProduct.description}
                onChange={handleDescriptionChange}
              />
            </div>

            {/* Action Buttons: Approve & Inaccessible */}
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

            {/* Workflow Guidance Box */}
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              <strong>VernX Workflow:</strong>
              <div style={{ marginTop: '4px' }}>
                1. Select image (Demo P01–P10 or upload)<br/>
                2. AI detects features dynamically<br/>
                3. Merchant chooses what to highlight<br/>
                4. AI writes positive catalogue bullets<br/>
                5. Editor edits & approves for export
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Honest Disclaimer Footer */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div style={{ fontSize: '0.78rem', color: '#999', maxWidth: '800px' }}>
            <strong>Case C04 Prototype Notice:</strong> VernX is an AI-assisted merchant review platform.
            Use of this tool alone does NOT prove site accessibility compliance.
          </div>
          <div style={{ fontSize: '0.8rem', color: '#FF9900' }}>
            Fynd × NMIMS Hyderabad — Case C04
          </div>
        </div>
      </footer>
    </div>
  );
}
