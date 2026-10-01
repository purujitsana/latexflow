import { useEffect, useRef, useState } from 'react'
import katex from 'katex'

export function renderKatex(latex: string, displayMode: boolean): { html: string; error: string | null } {
  try {
    const html = katex.renderToString(latex || '\\,', {
      throwOnError: true,
      displayMode,
    })
    return { html, error: null }
  } catch (err) {
    return { html: '', error: err instanceof Error ? err.message : String(err) }
  }
}

/** Auto-growing textarea used by both math node views while editing. */
export function AutoTextarea({
  value,
  onChange,
  onCommit,
  onCancel,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      className={className}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
          e.preventDefault()
          onCommit()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
        e.stopPropagation()
      }}
      onBlur={onCommit}
    />
  )
}

export function useEditToggle(initial = false) {
  const [editing, setEditing] = useState(initial)
  return { editing, setEditing }
}
