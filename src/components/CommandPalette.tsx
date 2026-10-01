import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useUiStore } from '../state/uiStore'
import { getCommands } from '../editor/commands'

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const commands = getCommands()
  const filtered = useMemo(
    () => commands.filter((c) => `${c.group} ${c.label}`.toLowerCase().includes(query.toLowerCase())),
    [commands, query],
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  if (!open) return null

  const run = (id: string) => {
    filtered.find((c) => c.id === id)?.run()
    setOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 lf-animate-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="w-[520px] max-h-[60vh] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-3 h-11 border-b border-[var(--color-border)]">
          <Search size={15} className="text-[var(--color-text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter' && filtered[activeIndex]) {
                run(filtered[activeIndex].id)
              }
            }}
            placeholder="Type a command…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <kbd className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 rounded">Esc</kbd>
        </div>
        <div className="overflow-y-auto py-1">
          {filtered.length === 0 && <div className="px-4 py-6 text-sm text-center text-[var(--color-text-muted)]">No matching commands</div>}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm ${
                i === activeIndex ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]' : 'hover:bg-[var(--color-bg-inset)]'
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => run(c.id)}
            >
              <span>
                <span className="text-[var(--color-text-muted)] mr-2">{c.group}</span>
                {c.label}
              </span>
              {c.shortcut && <kbd className="text-[10px] text-[var(--color-text-muted)]">{c.shortcut}</kbd>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
