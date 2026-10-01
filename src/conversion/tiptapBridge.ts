// Converts between Tiptap/ProseMirror's JSON document format and our
// internal DocumentModel. This is the only place that needs to know Tiptap's
// node/mark shapes — the LaTeX generator and parser never see them.
import type { JSONContent } from '@tiptap/core'
import type {
  Alignment,
  BlockNode,
  DocumentModel,
  InlineNode,
  ListItemNode,
  Mark,
  TableRowNode,
} from '../types/document'

// ---------------------------------------------------------------------------
// Tiptap JSON -> DocumentModel
// ---------------------------------------------------------------------------
function marksFromTiptap(marks: JSONContent['marks']): Mark[] {
  if (!marks) return []
  const out: Mark[] = []
  for (const m of marks) {
    switch (m.type) {
      case 'bold':
        out.push({ type: 'bold' })
        break
      case 'italic':
        out.push({ type: 'italic' })
        break
      case 'underline':
        out.push({ type: 'underline' })
        break
      case 'strike':
        out.push({ type: 'strike' })
        break
      case 'code':
        out.push({ type: 'code' })
        break
      case 'subscript':
        out.push({ type: 'subscript' })
        break
      case 'superscript':
        out.push({ type: 'superscript' })
        break
      case 'highlight':
        out.push({ type: 'highlight' })
        break
      case 'link':
        out.push({ type: 'link', attrs: { href: m.attrs?.href } })
        break
      case 'textStyle':
        if (m.attrs?.color) out.push({ type: 'color', attrs: { color: m.attrs.color } })
        break
      default:
        break
    }
  }
  return out
}

function inlineFromTiptap(nodes: JSONContent[] | undefined): InlineNode[] {
  if (!nodes) return []
  const out: InlineNode[] = []
  for (const n of nodes) {
    if (n.type === 'text') {
      out.push({ kind: 'text', text: n.text ?? '', marks: marksFromTiptap(n.marks) })
    } else if (n.type === 'mathInline') {
      out.push({ kind: 'inlineMath', latex: n.attrs?.latex ?? '' })
    } else if (n.type === 'hardBreak') {
      out.push({ kind: 'text', text: '\n' })
    }
  }
  return out
}

function alignFromAttrs(attrs: JSONContent['attrs']): Alignment | undefined {
  const a = attrs?.textAlign
  return a === 'left' || a === 'center' || a === 'right' || a === 'justify' ? a : undefined
}

function listItemFromTiptap(node: JSONContent, taskList: boolean): ListItemNode {
  const content = (node.content ?? []).map(blockFromTiptap).filter(Boolean) as BlockNode[]
  return taskList ? { content, checked: !!node.attrs?.checked } : { content }
}

function tableRowFromTiptap(node: JSONContent): TableRowNode {
  return {
    cells: (node.content ?? []).map((cell) => ({
      content: (cell.content ?? []).map(blockFromTiptap).filter(Boolean) as BlockNode[],
      header: cell.type === 'tableHeader',
    })),
  }
}

function blockFromTiptap(node: JSONContent): BlockNode | null {
  switch (node.type) {
    case 'paragraph':
      return { kind: 'paragraph', align: alignFromAttrs(node.attrs), content: inlineFromTiptap(node.content) }
    case 'heading':
      return {
        kind: 'heading',
        level: (node.attrs?.level ?? 1) as 1 | 2 | 3 | 4,
        align: alignFromAttrs(node.attrs),
        content: inlineFromTiptap(node.content),
      }
    case 'bulletList':
      return { kind: 'bulletList', items: (node.content ?? []).map((li) => listItemFromTiptap(li, false)) }
    case 'orderedList':
      return {
        kind: 'orderedList',
        start: node.attrs?.start,
        items: (node.content ?? []).map((li) => listItemFromTiptap(li, false)),
      }
    case 'taskList':
      return { kind: 'bulletList', task: true, items: (node.content ?? []).map((li) => listItemFromTiptap(li, true)) }
    case 'blockquote':
      return { kind: 'quote', content: (node.content ?? []).map(blockFromTiptap).filter(Boolean) as BlockNode[] }
    case 'codeBlock':
      return {
        kind: 'codeBlock',
        language: node.attrs?.language ?? undefined,
        code: (node.content ?? []).map((t) => t.text ?? '').join(''),
      }
    case 'mathBlock':
      return {
        kind: 'equation',
        latex: node.attrs?.latex ?? '',
        numbered: !!node.attrs?.numbered,
        environment: node.attrs?.environment ?? 'equation',
        label: node.attrs?.label || undefined,
      }
    case 'table':
      return {
        kind: 'table',
        rows: (node.content ?? []).map(tableRowFromTiptap),
        caption: node.attrs?.caption || undefined,
      }
    case 'image':
      return {
        kind: 'image',
        src: node.attrs?.src ?? '',
        alt: node.attrs?.alt || undefined,
        caption: node.attrs?.caption || undefined,
        width: node.attrs?.width || undefined,
      }
    case 'horizontalRule':
      return { kind: 'horizontalRule' }
    case 'pageBreak':
      return { kind: 'pageBreak' }
    default:
      return null
  }
}

export function tiptapJsonToModel(json: JSONContent, base: DocumentModel): DocumentModel {
  const content = (json.content ?? []).map(blockFromTiptap).filter(Boolean) as BlockNode[]
  return {
    ...base,
    content: content.length ? content : [{ kind: 'paragraph', content: [] }],
    metadata: { ...base.metadata, updatedAt: new Date().toISOString() },
  }
}

// ---------------------------------------------------------------------------
// DocumentModel -> Tiptap JSON
// ---------------------------------------------------------------------------
function marksToTiptap(marks: Mark[] | undefined): JSONContent['marks'] {
  if (!marks || marks.length === 0) return undefined
  return marks.map((m): NonNullable<JSONContent['marks']>[number] => {
    switch (m.type) {
      case 'link':
        return { type: 'link', attrs: { href: m.attrs?.href ?? '' } }
      case 'color':
        return { type: 'textStyle', attrs: { color: m.attrs?.color } }
      default:
        return { type: m.type }
    }
  })
}

function inlineToTiptap(nodes: InlineNode[]): JSONContent[] {
  if (nodes.length === 0) return []
  return nodes.map((n) =>
    n.kind === 'inlineMath'
      ? { type: 'mathInline', attrs: { latex: n.latex } }
      : { type: 'text', text: n.text || ' ', marks: marksToTiptap(n.marks) },
  )
}

function listItemToTiptap(item: ListItemNode, taskList: boolean): JSONContent {
  const content = item.content.map(blockToTiptap)
  return taskList
    ? { type: 'taskItem', attrs: { checked: !!item.checked }, content }
    : { type: 'listItem', content }
}

function tableRowToTiptap(row: TableRowNode): JSONContent {
  return {
    type: 'tableRow',
    content: row.cells.map((cell) => ({
      type: cell.header ? 'tableHeader' : 'tableCell',
      content: cell.content.map(blockToTiptap),
    })),
  }
}

function ensureInlineContent(nodes: JSONContent[]): JSONContent[] | undefined {
  return nodes.length ? nodes : undefined
}

export function blockToTiptap(block: BlockNode): JSONContent {
  switch (block.kind) {
    case 'paragraph':
      return {
        type: 'paragraph',
        attrs: block.align ? { textAlign: block.align } : undefined,
        content: ensureInlineContent(inlineToTiptap(block.content)),
      }
    case 'heading':
      return {
        type: 'heading',
        attrs: { level: block.level, textAlign: block.align },
        content: ensureInlineContent(inlineToTiptap(block.content)),
      }
    case 'bulletList':
      return block.task
        ? { type: 'taskList', content: block.items.map((i) => listItemToTiptap(i, true)) }
        : { type: 'bulletList', content: block.items.map((i) => listItemToTiptap(i, false)) }
    case 'orderedList':
      return {
        type: 'orderedList',
        attrs: block.start ? { start: block.start } : undefined,
        content: block.items.map((i) => listItemToTiptap(i, false)),
      }
    case 'quote':
      return { type: 'blockquote', content: block.content.map(blockToTiptap) }
    case 'codeBlock':
      return {
        type: 'codeBlock',
        attrs: block.language ? { language: block.language } : undefined,
        content: block.code ? [{ type: 'text', text: block.code }] : undefined,
      }
    case 'equation':
      return {
        type: 'mathBlock',
        attrs: {
          latex: block.latex,
          numbered: !!block.numbered,
          environment: block.environment ?? 'equation',
          label: block.label ?? '',
        },
      }
    case 'table':
      return {
        type: 'table',
        attrs: block.caption ? { caption: block.caption } : undefined,
        content: block.rows.map(tableRowToTiptap),
      }
    case 'image':
      return {
        type: 'image',
        attrs: { src: block.src, alt: block.alt, caption: block.caption, width: block.width },
      }
    case 'horizontalRule':
      return { type: 'horizontalRule' }
    case 'pageBreak':
      return { type: 'pageBreak' }
    case 'unsupported':
      // Rendered read-only via the mathBlock-adjacent "unsupported" node so
      // the raw LaTeX source is never silently dropped from the document.
      return { type: 'unsupportedBlock', attrs: { raw: block.raw, reason: block.reason ?? '' } }
    default:
      return { type: 'paragraph', content: [] }
  }
}

export function modelToTiptapJson(doc: DocumentModel): JSONContent {
  return { type: 'doc', content: doc.content.map(blockToTiptap) }
}
