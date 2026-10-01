import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { AutoTextarea, renderKatex, useEditToggle } from './MathShared'

function MathInlineView({ node, updateAttributes, selected }: NodeViewProps) {
  const { editing, setEditing } = useEditToggle(false)
  const latex: string = node.attrs.latex ?? ''

  if (editing) {
    return (
      <NodeViewWrapper as="span" className="lf-math-inline lf-animate-in" style={{ display: 'inline-block' }}>
        <AutoTextarea
          value={latex}
          onChange={(v) => updateAttributes({ latex: v })}
          onCommit={() => setEditing(false)}
          onCancel={() => setEditing(false)}
          placeholder="e.g. \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
          className="min-w-[6ch] resize-none border border-[var(--color-accent)] rounded px-1 font-mono text-sm bg-[var(--color-bg)] text-[var(--color-text)]"
        />
      </NodeViewWrapper>
    )
  }

  const { html, error } = renderKatex(latex, false)
  return (
    <NodeViewWrapper
      as="span"
      className={`lf-math-inline${selected ? ' ring-2 ring-[var(--color-accent)]' : ''}`}
      onClick={() => setEditing(true)}
      title="Click to edit equation"
    >
      {error ? <span className="lf-math-error">${latex}$</span> : <span dangerouslySetInnerHTML={{ __html: html }} />}
    </NodeViewWrapper>
  )
}

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-math-inline]' }]
  },

  // The NodeView handles real editor rendering; this fallback only matters
  // for editor.getHTML() / clipboard serialization outside the editor.
  renderHTML({ HTMLAttributes, node }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-math-inline': '' }), `$${node.attrs.latex ?? ''}$`]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView)
  },
})
