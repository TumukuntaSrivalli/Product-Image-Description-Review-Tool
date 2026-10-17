import { useReviewStore } from '../../store/useReviewStore'

export function ShortcutsModal() {
  const { showShortcutsModal, setShowShortcutsModal } = useReviewStore()

  if (!showShortcutsModal) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      onClick={() => setShowShortcutsModal(false)}
    >
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 id="shortcuts-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
            Keyboard Shortcuts
          </h3>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowShortcutsModal(false)}
            aria-label="Close shortcuts modal"
            style={{ minHeight: '32px', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--muted)', marginTop: '8px' }}>
          VarnX is built for high-speed editorial workflows with comprehensive keyboard navigation.
        </p>

        <div className="shortcuts-list">
          <div className="shortcut-item">
            <span>Next Product</span>
            <kbd>J</kbd>
          </div>
          <div className="shortcut-item">
            <span>Previous Product</span>
            <kbd>K</kbd>
          </div>
          <div className="shortcut-item">
            <span>Edit Description</span>
            <kbd>E</kbd>
          </div>
          <div className="shortcut-item">
            <span>Approve Alt Text</span>
            <kbd>A</kbd>
          </div>
          <div className="shortcut-item">
            <span>Flag Inaccessible</span>
            <kbd>F</kbd>
          </div>
          <div className="shortcut-item">
            <span>Toggle Decorative</span>
            <kbd>D</kbd>
          </div>
          <div className="shortcut-item">
            <span>Generate Draft</span>
            <kbd>G</kbd>
          </div>
          <div className="shortcut-item">
            <span>Toggle Dark/Light</span>
            <kbd>T</kbd>
          </div>
          <div className="shortcut-item">
            <span>Save Changes</span>
            <span><kbd>Ctrl</kbd> + <kbd>S</kbd></span>
          </div>
          <div className="shortcut-item">
            <span>Command Palette</span>
            <span><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-amazon-primary"
            onClick={() => setShowShortcutsModal(false)}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
