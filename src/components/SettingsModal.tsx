import { useUiStore } from '../state/uiStore'
import { useSettingsStore } from '../state/settingsStore'
import { Modal } from './ui/Modal'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <label className="text-sm text-[var(--color-text-muted)]">{label}</label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1 mt-3">{title}</h3>
      <div className="rounded-lg border border-[var(--color-border)] px-3 divide-y divide-[var(--color-border)]">{children}</div>
    </div>
  )
}

const inputCls = 'bg-[var(--color-bg-inset)] rounded px-2 py-1 text-sm outline-none w-28'

export function SettingsModal() {
  const open = useUiStore((s) => s.settingsOpen)
  const setOpen = useUiStore((s) => s.setSettingsOpen)
  const settings = useSettingsStore()

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Settings" width={560}>
      <Section title="Editor">
        <Row label="Font size">
          <input
            type="number"
            className={inputCls}
            value={settings.fontSize}
            min={10}
            max={28}
            onChange={(e) => settings.set({ fontSize: Number(e.target.value) })}
          />
        </Row>
        <Row label="Line spacing">
          <input
            type="number"
            step={0.1}
            className={inputCls}
            value={settings.lineSpacing}
            onChange={(e) => settings.set({ lineSpacing: Number(e.target.value) })}
          />
        </Row>
        <Row label="Editor width (px)">
          <input
            type="number"
            className={inputCls}
            value={settings.editorWidth}
            min={480}
            max={1200}
            onChange={(e) => settings.set({ editorWidth: Number(e.target.value) })}
          />
        </Row>
        <Row label="Tab size">
          <input
            type="number"
            className={inputCls}
            value={settings.tabSize}
            min={2}
            max={8}
            onChange={(e) => settings.set({ tabSize: Number(e.target.value) })}
          />
        </Row>
        <Row label="Word wrap (LaTeX editor)">
          <input type="checkbox" checked={settings.wordWrap} onChange={(e) => settings.set({ wordWrap: e.target.checked })} />
        </Row>
      </Section>

      <Section title="Synchronization">
        <Row label="Debounce interval (ms)">
          <input
            type="number"
            className={inputCls}
            value={settings.debounceMs}
            min={50}
            max={1000}
            step={50}
            onChange={(e) => settings.set({ debounceMs: Number(e.target.value) })}
          />
        </Row>
        <Row label="Automatic synchronization">
          <input type="checkbox" checked={settings.autoSync} onChange={(e) => settings.set({ autoSync: e.target.checked })} />
        </Row>
        <Row label="Conversion warnings">
          <input
            type="checkbox"
            checked={settings.conversionWarnings}
            onChange={(e) => settings.set({ conversionWarnings: e.target.checked })}
          />
        </Row>
      </Section>

      <Section title="LaTeX">
        <Row label="Document class">
          <input
            className={inputCls}
            value={settings.documentClass}
            onChange={(e) => settings.set({ documentClass: e.target.value })}
          />
        </Row>
        <Row label="Default packages">
          <input
            className="bg-[var(--color-bg-inset)] rounded px-2 py-1 text-sm outline-none w-64"
            value={settings.packages.join(', ')}
            onChange={(e) => settings.set({ packages: e.target.value.split(',').map((p) => p.trim()).filter(Boolean) })}
          />
        </Row>
        <Row label="Indentation">
          <input
            type="number"
            className={inputCls}
            value={settings.latexIndent}
            onChange={(e) => settings.set({ latexIndent: Number(e.target.value) })}
          />
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <select
            className={inputCls}
            value={settings.theme}
            onChange={(e) => settings.set({ theme: e.target.value as 'light' | 'dark' })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>
        <Row label="Layout">
          <select
            className={inputCls}
            value={settings.layout}
            onChange={(e) => settings.set({ layout: e.target.value as typeof settings.layout })}
          >
            <option value="split">Split</option>
            <option value="stacked">Stacked</option>
            <option value="doc-only">Document only</option>
            <option value="latex-only">LaTeX only</option>
          </select>
        </Row>
      </Section>

      <button className="text-xs text-[var(--color-danger)] mt-2" onClick={() => settings.resetDefaults()}>
        Reset to defaults
      </button>
    </Modal>
  )
}
