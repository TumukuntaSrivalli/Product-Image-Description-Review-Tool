import { useEffect, useState } from 'react'

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [ringPosition, setRingPosition] = useState({ x: -100, y: -100 })
  const [cursorType, setCursorType] = useState<'default' | 'hover' | 'scan'>('default')
  const [cursorLabel, setCursorLabel] = useState<string>('')
  const [visible, setVisible] = useState(false)
  const [isTouchOrReduced, setIsTouchOrReduced] = useState(false)

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isTouch || prefersReducedMotion) {
      setIsTouchOrReduced(true)
      return
    }

    const onMouseMove = (e: MouseEvent) => {
      setVisible(true)
      setPosition({ x: e.clientX, y: e.clientY })

      // Check target element for custom cursor triggers
      const target = e.target as HTMLElement | null
      if (!target) return

      if (target.closest('input, textarea')) {
        setVisible(false)
        return
      }

      const scanTarget = target.closest('.viewer-image-stage, .viewer-main-image')
      if (scanTarget) {
        setCursorType('scan')
        setCursorLabel('Scan')
        return
      }

      const approveBtn = target.closest('.btn-amazon-primary')
      if (approveBtn) {
        setCursorType('hover')
        setCursorLabel('Approve')
        return
      }

      const reviewItem = target.closest('.filmstrip-card')
      if (reviewItem) {
        setCursorType('hover')
        setCursorLabel('Review')
        return
      }

      const interactive = target.closest('button, a, [role="button"]')
      if (interactive) {
        setCursorType('hover')
        setCursorLabel('')
        return
      }

      setCursorType('default')
      setCursorLabel('')
    }

    const onMouseLeave = () => setVisible(false)

    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  // Smooth spring-like follower for outer ring
  useEffect(() => {
    if (isTouchOrReduced) return
    let animId: number
    const updateRing = () => {
      setRingPosition((prev) => ({
        x: prev.x + (position.x - prev.x) * 0.22,
        y: prev.y + (position.y - prev.y) * 0.22,
      }))
      animId = requestAnimationFrame(updateRing)
    }
    animId = requestAnimationFrame(updateRing)
    return () => cancelAnimationFrame(animId)
  }, [position, isTouchOrReduced])

  if (isTouchOrReduced || !visible) return null

  return (
    <>
      <div
        className="custom-cursor-dot"
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        aria-hidden="true"
      />
      <div
        className={`custom-cursor-ring ${cursorType === 'hover' ? 'cursor-hover' : ''} ${cursorType === 'scan' ? 'custom-cursor-crosshair' : ''}`}
        style={{ transform: `translate3d(${ringPosition.x}px, ${ringPosition.y}px, 0)` }}
        aria-hidden="true"
      >
        {cursorLabel && <span className="custom-cursor-label">{cursorLabel}</span>}
      </div>
    </>
  )
}
