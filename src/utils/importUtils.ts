import type { BlockNode, DocumentModel, InlineNode, ListItemNode } from '../types/document'
import { createEmptyDocument } from '../types/document'
import { parseLatexDocument } from '../conversion/latexParser'

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/** Minimal Markdown -> DocumentModel importer for the documented subset:
 *  headings, bold/italic, bullet/ordered lists, code fences, blockquotes,
 *  $$ / $ math, and plain paragraphs. Not a full CommonMark parser. */
export function parseMarkdown(source: string): DocumentModel {
  const doc = createEmptyDocument()
  const lines = source.split('\n')
  const content: BlockNode[] = []
  let i = 0

  const inlineMd = (text: string): InlineNode[] => {
    const nodes: InlineNode[] = []
    let buf = ''
    let j = 0
    const flush = () => {
      if (buf) nodes.push({ kind: 'text', text: buf })
      buf = ''
    }
    while (j < text.length) {
      if (text[j] === '$') {
        const end = text.indexOf('$', j + 1)
        if (end !== -1) {
          flush()
          nodes.push({ kind: 'inlineMath', latex: text.slice(j + 1, end) })
          j = end + 1
          continue
        }
      }
      if (text.slice(j, j + 2) === '**') {
        const end = text.indexOf('**', j + 2)
        if (end !== -1) {
          flush()
          nodes.push({ kind: 'text', text: text.slice(j + 2, end), marks: [{ type: 'bold' }] })
          j = end + 2
          continue
        }
      }
      if (text[j] === '*') {
        const end = text.indexOf('*', j + 1)
        if (end !== -1) {
          flush()
          nodes.push({ kind: 'text', text: text.slice(j + 1, end), marks: [{ type: 'italic' }] })
          j = end + 1
          continue
        }
      }
      buf += text[j]
      j++
    }
    flush()
    return nodes
  }

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line)
    if (heading) {
      content.push({ kind: 'heading', level: heading[1].length as 1 | 2 | 3 | 4, content: inlineMd(heading[2]) })
      i++
      continue
    }
    if (line.trim() === '```' || line.trim().startsWith('```')) {
      const lang = line.trim().slice(3)
      const codeLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '```') {
        codeLines.push(lines[i])
        i++
      }
      i++
      content.push({ kind: 'codeBlock', language: lang || undefined, code: codeLines.join('\n') })
      continue
    }
    if (line.trim() === '$$') {
      const mathLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '$$') {
        mathLines.push(lines[i])
        i++
      }
      i++
      content.push({ kind: 'equation', latex: mathLines.join('\n').trim() })
      continue
    }
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      content.push({
        kind: 'quote',
        content: [{ kind: 'paragraph', content: inlineMd(quoteLines.join(' ')) }],
      })
      continue
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line)
      const items: ListItemNode[] = []
      while (i < lines.length && (ordered ? /^\d+\.\s+/.test(lines[i]) : /^[-*]\s+/.test(lines[i]))) {
        const text = lines[i].replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, '')
        const taskMatch = /^\[( |x)\]\s+/.exec(text)
        const cleanText = taskMatch ? text.slice(taskMatch[0].length) : text
        const item: ListItemNode = { content: [{ kind: 'paragraph', content: inlineMd(cleanText) }] }
        if (taskMatch) item.checked = taskMatch[1] === 'x'
        items.push(item)
        i++
      }
      content.push(
        ordered
          ? { kind: 'orderedList', items }
          : { kind: 'bulletList', items, task: items.some((it) => it.checked !== undefined) },
      )
      continue
    }
    if (/^---+$/.test(line.trim())) {
      content.push({ kind: 'horizontalRule' })
      i++
      continue
    }
    // Paragraph: consume until blank line.
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim()) {
      paraLines.push(lines[i])
      i++
    }
    content.push({ kind: 'paragraph', content: inlineMd(paraLines.join(' ')) })
  }

  doc.content = content.length ? content : [{ kind: 'paragraph', content: [] }]
  return doc
}

export function parsePlainText(source: string): DocumentModel {
  const doc = createEmptyDocument()
  doc.content = source
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({ kind: 'paragraph' as const, content: [{ kind: 'text' as const, text: p.replace(/\n/g, ' ') }] }))
  if (doc.content.length === 0) doc.content = [{ kind: 'paragraph', content: [] }]
  return doc
}

export interface ImportResult {
  doc: DocumentModel
  latexSource: string
  diagnostics: { line: number; message: string; severity: 'error' | 'warning' | 'info' }[]
}

export function importFile(name: string, source: string): ImportResult {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'tex') {
    const { doc, diagnostics } = parseLatexDocument(source)
    return { doc, latexSource: source, diagnostics }
  }
  if (ext === 'md' || ext === 'markdown') {
    const doc = parseMarkdown(source)
    return { doc, latexSource: '', diagnostics: [] }
  }
  const doc = parsePlainText(source)
  return { doc, latexSource: '', diagnostics: [] }
}
