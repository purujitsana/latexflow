import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'

// Represents LaTeX the parser could not confidently map to a rich-text
// construct. The raw source is preserved verbatim and shown read-only here;
// editing it happens on the LaTeX side, never destructively in the document.
function UnsupportedBlockView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper className="lf-unsupported block whitespace-pre-wrap" contentEditable={false}>
      <div className="text-[10px] uppercase tracking-wide mb-1 opacity-80">
        Unsupported LaTeX construct{node.attrs.reason ? ` — ${node.attrs.reason}` : ''}
      </div>
      {node.attrs.raw}
    </NodeViewWrapper>
  )
}

export const UnsupportedBlock = Node.create({
  name: 'unsupportedBlock',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      raw: { default: '' },
      reason: { default: '' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-unsupported]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-unsupported': '' }), node.attrs.raw ?? '']
  },

  addNodeView() {
    return ReactNodeViewRenderer(UnsupportedBlockView)
  },
})
