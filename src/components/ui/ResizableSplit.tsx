import { useCallback, useRef, useState, type ReactNode } from 'react'

export function ResizableSplit({
  direction = 'horizontal',
  first,
  second,
  initialRatio = 0.5,
  min = 0.2,
  max = 0.8,
}: {
  direction?: 'horizontal' | 'vertical'
  first: ReactNode
  second: ReactNode
  initialRatio?: number
  min?: number
  max?: number
}) {
  const [ratio, setRatio] = useState(initialRatio)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onPointerDown = useCallback(() => {
    dragging.current = true
    const onMove = (e: PointerEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pos = direction === 'horizontal' ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height
      setRatio(Math.min(max, Math.max(min, pos)))
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [direction, min, max])

  const isRow = direction === 'horizontal'

  return (
    <div ref={containerRef} className={`flex ${isRow ? 'flex-row' : 'flex-col'} h-full w-full min-h-0 min-w-0`}>
      <div className="min-h-0 min-w-0 overflow-hidden" style={{ flexBasis: `${ratio * 100}%` }}>
        {first}
      </div>
      <div
        role="separator"
        aria-orientation={isRow ? 'vertical' : 'horizontal'}
        className={
          isRow
            ? 'w-1 shrink-0 cursor-col-resize bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors'
            : 'h-1 shrink-0 cursor-row-resize bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors'
        }
        onPointerDown={onPointerDown}
      />
      <div className="min-h-0 min-w-0 overflow-hidden flex-1">{second}</div>
    </div>
  )
}
