import { useState } from 'react'
import type { ImageRecord, ReviewSavePayload } from '../../types'
import { computeWordDiff, validateAltTextClient } from '../../lib/validators'

interface EditorPanelProps {
  image: ImageRecord
  onSave: (payload: ReviewSavePayload) => void
  onApprove: () => void
  onFlag: (reason: string) => void
  onReset: () => void
  onGenerateDraft: () => void
  isSaving?: boolean
  isApproving?: boolean
}

export function EditorPanel({
  image,
  onSave,
  onApprove,
  onFlag,
  onReset,
  onGenerateDraft,
  isSaving: _isSaving = false,
  isApproving = false,
}: EditorPanelProps) {
  const [editedText, setEditedText] = useState(image.edited_text || image.draft || '')
  const [pageContext, setPageContext] = useState(image.page_context || '')
  const [isDecorative, setIsDecorative] = useState(image.is_decorative || false)
  const [containsText, setContainsText] = useState(image.contains_text || false)
  const [multipleProducts, setMultipleProducts] = useState(image.multiple_products || false)
  const [showDiff, setShowDiff] = useState(false)
  const [flagModalOpen, setFlagModalOpen] = useState(false)
  const [flagReason, setFlagReason] = useState('needs better source image')

  // Run client-side validation live on every keystroke
  const validation = validateAltTextClient(isDecorative ? '' : editedText, {
    isDecorative,
    metadataTitle: image.metadata_title,
    pageContext,
    containsText,
    multipleProducts,
  })

  const charCount = editedText.trim().length
  const getCharCountClass = () => {
    if (charCount <= 125) return 'green'
    if (charCount <= 250) return 'amber'
    return 'red'
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setEditedText(val)
    onSave({
      edited_text: val,
      page_context: pageContext,
      is_decorative: isDecorative,
      contains_text: containsText,
      multiple_products: multipleProducts,
    })
  }

  const handlePageContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setPageContext(val)
    onSave({
      edited_text: editedText,
      page_context: val,
      is_decorative: isDecorative,
      contains_text: containsText,
      multiple_products: multipleProducts,
    })
  }

  const handleDecorativeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsDecorative(checked)
    onSave({
      edited_text: checked ? '' : editedText,
      page_context: pageContext,
      is_decorative: checked,
      contains_text: containsText,
      multiple_products: multipleProducts,
    })
  }

  const handleContainsTextToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setContainsText(checked)
    onSave({
      edited_text: editedText,
      page_context: pageContext,
      is_decorative: isDecorative,
      contains_text: checked,
      multiple_products: multipleProducts,
    })
  }

  const handleMultipleProductsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setMultipleProducts(checked)
    onSave({
      edited_text: editedText,
      page_context: pageContext,
      is_decorative: isDecorative,
      contains_text: containsText,
      multiple_products: checked,
    })
  }

  const { draftTokens, editedTokens } = computeWordDiff(image.draft || '', editedText)

  return (
    <aside className="editor-panel" aria-label="Product Description Editor">
      {/* Draft Source Card */}
      <div className="draft-source-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className={`draft-source-badge ${image.source_label.includes('AI') ? 'ai-model' : 'rule-based'}`}
          >
            Source: {image.source_label}
          </span>
          <button
            type="button"
            className="btn-ghost"
            onClick={onGenerateDraft}
            aria-label="Regenerate initial draft"
            style={{ minHeight: '26px', padding: '2px 8px', fontSize: '0.72rem' }}
          >
            ↻ Regenerate Draft
          </button>
        </div>
        <div className="draft-text-preview">
          "{image.draft || image.visible_description}"
        </div>
      </div>

      {/* Editable Alt Text Area */}
      <div className="textarea-wrapper">
        <div className="editor-section-title">
          <label htmlFor="editor-alt-textarea">
            Final Image Description (Alt Text)
          </label>
          <div className="char-counter-bar">
            <span className={`char-counter-count ${getCharCountClass()}`}>
              {isDecorative ? '0 (Decorative)' : `${charCount} / 125 chars`}
            </span>
          </div>
        </div>

        <textarea
          id="editor-alt-textarea"
          className="editor-textarea"
          value={isDecorative ? '' : editedText}
          onChange={handleTextChange}
          disabled={isDecorative}
          placeholder={isDecorative ? 'Marked decorative (alt="")' : 'Describe the observable product attributes...'}
          aria-describedby="char-count-desc"
          rows={4}
        />

        {/* Live Unsupported Word Highlighting & Warnings */}
        {validation.offending_details.length > 0 && (
          <div className="unsupported-chips-list" role="alert">
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--rose)' }}>
              Unsupported claims blocked:
            </span>
            {validation.offending_details.map((off, idx) => (
              <span
                key={idx}
                className="unsupported-word-chip"
                title={off.reason}
              >
                ✕ {off.word} ({off.category})
              </span>
            ))}
          </div>
        )}

        {/* Colour Uncertainty Warning */}
        {validation.flags.includes('colour uncertain') && (
          <div className="chip-uncertain-colour" role="status">
            <span>ℹ️ Colour uncertain: visual nuance differs from metadata or wording indicates ambiguity (e.g. "appears blue")</span>
          </div>
        )}
      </div>

      {/* Page Context (Adjacent Copy) */}
      <div className="textarea-wrapper">
        <label htmlFor="editor-page-context" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
          Page Context (Adjacent Copy)
        </label>
        <textarea
          id="editor-page-context"
          className="editor-textarea"
          value={pageContext}
          onChange={handlePageContextChange}
          placeholder="Paste adjacent product heading, bullet points, or page context here..."
          rows={2}
          style={{ minHeight: '64px' }}
        />
      </div>

      {/* Catalog Toggles */}
      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={isDecorative}
            onChange={handleDecorativeToggle}
          />
          <span><strong>Purely decorative image</strong> (allow empty alt="")</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={containsText}
            onChange={handleContainsTextToggle}
          />
          <span><strong>Contains visible text</strong> (requires transcription)</span>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            checked={multipleProducts}
            onChange={handleMultipleProductsToggle}
          />
          <span><strong>Multiple products shown</strong> (requires group description)</span>
        </label>
      </div>

      {/* Diff Toggle & Side-by-side View */}
      <div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setShowDiff(!showDiff)}
          style={{ width: '100%', fontSize: '0.8rem', minHeight: '32px' }}
        >
          {showDiff ? '▲ Hide Diff View' : '▼ Compare Draft vs Edited Diff'}
        </button>

        {showDiff && (
          <div className="diff-view-container" style={{ marginTop: '8px' }}>
            <div className="diff-col">
              <h5>Initial Draft</h5>
              <div>
                {draftTokens.map((t, i) => (
                  <span key={i} className={`diff-token ${t.type}`} style={{ marginRight: '4px' }}>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="diff-col">
              <h5>Edited Alt Text</h5>
              <div>
                {editedTokens.map((t, i) => (
                  <span key={i} className={`diff-token ${t.type}`} style={{ marginRight: '4px' }}>
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Validation Checklist */}
      <div className="validation-checklist" aria-live="polite">
        <div className="validation-header">
          <span>Catalog Validation Quality Checks</span>
        </div>

        {/* Check 1: Length */}
        <div className={`validation-item ${charCount > 250 ? 'fail' : charCount > 125 ? 'warn' : 'pass'}`}>
          <span>{charCount > 250 ? '✕' : charCount > 125 ? '⚠️' : '✓'}</span>
          <span>
            {charCount > 250
              ? 'Hard block: length exceeds 250 characters'
              : charCount > 125
              ? 'Recommended limit: description exceeds 125 chars'
              : 'Length is within concise limits (≤ 125 chars)'}
          </span>
        </div>

        {/* Check 2: Unsupported claims */}
        <div className={`validation-item ${validation.offending_words.length > 0 ? 'fail' : 'pass'}`}>
          <span>{validation.offending_words.length > 0 ? '✕' : '✓'}</span>
          <span>
            {validation.offending_words.length > 0
              ? `Unsupported claims blocked: ${validation.offending_words.join(', ')}`
              : 'No unsupported material, certification, or performance claims'}
          </span>
        </div>

        {/* Check 3: Intro phrases */}
        <div className={`validation-item ${/^(image of|picture of|photo of)/i.test(editedText.trim()) ? 'fail' : 'pass'}`}>
          <span>{/^(image of|picture of|photo of)/i.test(editedText.trim()) ? '✕' : '✓'}</span>
          <span>Does not start with redundant "image of / photo of"</span>
        </div>

        {/* Check 4: Context repetition */}
        {validation.warnings.some((w) => w.includes('adjacent')) && (
          <div className="validation-item warn">
            <span>⚠️</span>
            <span>Warning: avoid repeating adjacent page context</span>
          </div>
        )}
      </div>

      {/* Action Buttons: 1-Click Approve, Flag Inaccessible, Reset */}
      <div className="action-buttons-row">
        <button
          type="button"
          className="btn-amazon-primary"
          onClick={onApprove}
          disabled={!validation.valid || isApproving}
          aria-label="Approve description for publishing"
        >
          {isApproving ? 'Approving...' : '✓ Approve & Publish Description'}
        </button>

        <div className="action-buttons-subrow">
          <button
            type="button"
            className="btn-outline-danger"
            onClick={() => setFlagModalOpen(true)}
            aria-label="Flag image as inaccessible"
          >
            🚩 Flag Inaccessible
          </button>
          <button
            type="button"
            className="btn-amazon-secondary"
            onClick={onReset}
            aria-label="Reset to original draft"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Flag Inaccessible Dialog */}
      {flagModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Flag Inaccessible Image"
          onClick={() => setFlagModalOpen(false)}
        >
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 12px 0' }}>Flag Inaccessible Image ({image.product_id})</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>
              Mark this asset if the image quality or composition makes accurate alt text impossible.
            </p>
            <div style={{ margin: '14px 0' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Reason for Flagging:
              </label>
              <select
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--paper)' }}
              >
                <option value="needs better source image">Needs better source image</option>
                <option value="low contrast resolution">Insufficient contrast / resolution</option>
                <option value="unclear subject matter">Subject matter is unidentifiable</option>
                <option value="blurry or distorted graphic">Blurry or distorted graphic</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setFlagModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-outline-danger"
                onClick={() => {
                  onFlag(flagReason)
                  setFlagModalOpen(false)
                }}
              >
                Confirm Flag
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
