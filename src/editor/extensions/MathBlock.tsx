import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { AutoTextarea, renderKatex, useEditToggle } from './MathShared'

function MathBlockView({ node, updateAttributes, selected }: NodeViewProps) {
  const { editing, setEditing } = useEditToggle(false)
  const latex: string = node.attrs.latex ?? ''
  const numbered: boolean = !!node.attrs.numbered
  const environment: string = node.attrs.environment ?? 'equation'

  if (editing) {
    return (
      <NodeViewWrapper className="lf-math-block lf-animate-in border border-[var(--color-accent)]">
        <AutoTextarea
          value={latex}
          onChange={(v) => updateAttributes({ latex: v })}
          onCommit={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          placeholder="F = ma"
          className="w-full resize-none border-none outline-none font-mono text-sm bg-transparent text-[var(--color-text)] text-left"
        />
        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)] justify-center flex-wrap">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={numbered}
              onChange={(e) => updateAttributes({ numbered: e.target.checked })}
            />
            Numbered
          </label>
          <select
            className="bg-[var(--color-bg-inset)] rounded px-1 py-0.5"
            value={environment}
            onChange={(e) => updateAttributes({ environment: e.target.value })}
          >
            <option value="equation">equation</option>
            <option value="align">align</option>
            <option value="gather">gather</option>
          </select>
          <input
            className="bg-[var(--color-bg-inset)] rounded px-1 py-0.5 w-28"
            placeholder="label (optional)"
            value={node.attrs.label ?? ''}
            onChange={(e) => updateAttributes({ label: e.target.value })}
          />
        </div>
      </NodeViewWrapper>
    )
  }

  const { html, error } = renderKatex(latex, true)
  return (
    <NodeViewWrapper
      className={`lf-math-block${selected ? ' ring-2 ring-[var(--color-accent)]' : ''}`}
      onClick={() => setEditing(true)}
      title="Click to edit equation"
    >
      {error ? (
        <span className="lf-math-error">{latex || '(empty equation)'}</span>
      ) : (
        <span dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </NodeViewWrapper>
  )
}

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      latex: { default: '' },
      numbered: { default: false },
      environment: { default: 'equation' },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-math-block]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-math-block': '' }), `\\[ ${node.attrs.latex ?? ''} \\]`]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView)
  },
})
