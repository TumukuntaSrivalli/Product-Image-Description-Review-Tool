import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { useReviewStore } from '../../store/useReviewStore'
import { getExportCsvUrl } from '../../lib/api'

interface CommandPaletteProps {
  products?: { product_id: string; metadata_title?: string | null; visible_description?: string }[]
  onGenerateAll?: () => void
}

export function CommandPalette({ products = [], onGenerateAll }: CommandPaletteProps) {
  const { showCommandPalette, setShowCommandPalette, setSelectedProductId, toggleTheme } = useReviewStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(!showCommandPalette)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandPalette, setShowCommandPalette])

  if (!showCommandPalette) return null

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={() => setShowCommandPalette(false)}
    >
      <div className="command-palette-dialog" onClick={(e) => e.stopPropagation()}>
        <Command label="Command Palette" shouldFilter={true}>
          <Command.Input
            placeholder="Type a product ID, command or page..."
            className="command-input"
            autoFocus
          />
          <Command.List className="command-list">
            <Command.Empty style={{ padding: '16px', color: 'var(--muted)', textAlign: 'center' }}>
              No matching products or commands found.
            </Command.Empty>

            <Command.Group heading="Product Catalogue">
              {products.map((p) => (
                <Command.Item
                  key={p.product_id}
                  className="command-item"
                  onSelect={() => {
                    setSelectedProductId(p.product_id)
                    setShowCommandPalette(false)
                    navigate('/review')
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--amazon-gold)' }}>
                    {p.product_id}
                  </span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.82rem', marginLeft: '12px' }}>
                    {p.metadata_title || p.visible_description}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Navigation">
              <Command.Item
                className="command-item"
                onSelect={() => {
                  setShowCommandPalette(false)
                  navigate('/review')
                }}
              >
                <span>Go to Review Workspace</span>
                <kbd>/review</kbd>
              </Command.Item>
              <Command.Item
                className="command-item"
                onSelect={() => {
                  setShowCommandPalette(false)
                  navigate('/export')
                }}
              >
                <span>Go to Export Studio</span>
                <kbd>/export</kbd>
              </Command.Item>
              <Command.Item
                className="command-item"
                onSelect={() => {
                  setShowCommandPalette(false)
                  navigate('/method')
                }}
              >
                <span>Go to Methodology & Standards</span>
                <kbd>/method</kbd>
              </Command.Item>
              <Command.Item
                className="command-item"
                onSelect={() => {
                  setShowCommandPalette(false)
                  navigate('/')
                }}
              >
                <span>Go to Home</span>
                <kbd>/</kbd>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item
                className="command-item"
                onSelect={() => {
                  toggleTheme()
                  setShowCommandPalette(false)
                }}
              >
                <span>Toggle Light / Dark Theme</span>
                <kbd>T</kbd>
              </Command.Item>
              {onGenerateAll && (
                <Command.Item
                  className="command-item"
                  onSelect={() => {
                    onGenerateAll()
                    setShowCommandPalette(false)
                  }}
                >
                  <span>Generate All 10 Drafts</span>
                  <kbd>G</kbd>
                </Command.Item>
              )}
              <Command.Item
                className="command-item"
                onSelect={() => {
                  window.open(getExportCsvUrl(), '_blank')
                  setShowCommandPalette(false)
                }}
              >
                <span>Download Approved CSV</span>
                <kbd>.csv</kbd>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
