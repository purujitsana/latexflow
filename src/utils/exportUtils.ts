import type { BlockNode, DocumentModel, InlineNode } from '../types/document'
import { documentToLatex } from '../conversion/documentToLatex'

export function downloadFile(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function slug(title: string): string {
  return (title || 'document').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'document'
}

export function exportTex(doc: DocumentModel): void {
  const latex = documentToLatex(doc, { fullDocument: true })
  downloadFile(`${slug(doc.metadata.title)}.tex`, latex, 'text/x-tex')
}

function inlineToMarkdown(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      if (n.kind === 'inlineMath') return `$${n.latex}$`
      let text = n.text
      const marks = n.marks ?? []
      const has = (t: string) => marks.some((m) => m.type === t)
      if (has('code')) text = `\`${text}\``
      if (has('bold')) text = `**${text}**`
      if (has('italic')) text = `*${text}*`
      if (has('strike')) text = `~~${text}~~`
      const link = marks.find((m) => m.type === 'link')
      if (link) text = `[${text}](${link.attrs?.href ?? ''})`
      return text
    })
    .join('')
}

function blockToMarkdown(block: BlockNode, indent = ''): string {
  switch (block.kind) {
    case 'paragraph':
      return indent + inlineToMarkdown(block.content)
    case 'heading':
      return `${indent}${'#'.repeat(block.level)} ${inlineToMarkdown(block.content)}`
    case 'bulletList':
      return block.items
        .map((item) => {
          const marker = block.task ? `- [${item.checked ? 'x' : ' '}] ` : '- '
          return item.content
            .map((b, bi) => (bi === 0 ? `${indent}${marker}${blockToMarkdown(b).trim()}` : blockToMarkdown(b, indent + '  ')))
            .join('\n')
        })
        .join('\n')
    case 'orderedList':
      return block.items
        .map((item, i) =>
          item.content
            .map((b, bi) => (bi === 0 ? `${indent}${i + 1}. ${blockToMarkdown(b).trim()}` : blockToMarkdown(b, indent + '   ')))
            .join('\n'),
        )
        .join('\n')
    case 'quote':
      return block.content.map((b) => `${indent}> ${blockToMarkdown(b).trim()}`).join('\n')
    case 'codeBlock':
      return ['```' + (block.language ?? ''), block.code, '```'].join('\n')
    case 'equation':
      return block.numbered ? `$$\n${block.latex}\n$$` : `$$${block.latex}$$`
    case 'table': {
      const rows = block.rows.map((r) => `| ${r.cells.map((c) => c.content.map((b) => blockToMarkdown(b)).join(' ')).join(' | ')} |`)
      if (rows.length > 0) {
        const sep = `| ${block.rows[0].cells.map(() => '---').join(' | ')} |`
        rows.splice(1, 0, sep)
      }
      return rows.join('\n')
    }
    case 'image':
      return `![${block.alt ?? ''}](${block.src})${block.caption ? `\n*${block.caption}*` : ''}`
    case 'horizontalRule':
      return '---'
    case 'pageBreak':
      return '<!-- page break -->'
    case 'unsupported':
      return block.raw
    default:
      return ''
  }
}

export function documentToMarkdown(doc: DocumentModel): string {
  return doc.content.map((b) => blockToMarkdown(b)).join('\n\n')
}

export function exportMarkdown(doc: DocumentModel): void {
  downloadFile(`${slug(doc.metadata.title)}.md`, documentToMarkdown(doc), 'text/markdown')
}

export function exportHtml(html: string, title: string): void {
  const full = `<!doctype html>\n<html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`
  downloadFile(`${slug(title)}.html`, full, 'text/html')
}

export function exportPlainText(text: string, title: string): void {
  downloadFile(`${slug(title)}.txt`, text, 'text/plain')
}
