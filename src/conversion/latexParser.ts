import type {
  BlockNode,
  Diagnostic,
  DocumentModel,
  InlineNode,
  ListItemNode,
  Mark,
  TableRowNode,
} from '../types/document'
import { createEmptyDocument, DEFAULT_PREAMBLE } from '../types/document'
import { unescapeLatex } from './escapeLatex'
import { parseLatexColorArg } from './latexColor'

export interface ParseResult {
  doc: DocumentModel
  diagnostics: Diagnostic[]
}

// -------------------------------------------------------------------------
// Balanced-brace helpers. Regex alone can't handle `\textbf{Hello \textit{World}}`
// correctly (non-greedy stops at the first `}`), so commands with argument
// braces are extracted by walking the string and tracking depth.
// -------------------------------------------------------------------------
function extractBraced(text: string, openIndex: number): { content: string; endIndex: number } | null {
  if (text[openIndex] !== '{') return null
  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\') {
      i++
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return { content: text.slice(openIndex + 1, i), endIndex: i }
    }
  }
  return null
}

function skipWhitespace(text: string, index: number): number {
  let i = index
  while (i < text.length && /\s/.test(text[i])) i++
  return i
}

// -------------------------------------------------------------------------
// Inline parsing
// -------------------------------------------------------------------------
const WRAP_COMMANDS: Record<string, Mark['type']> = {
  textbf: 'bold',
  bf: 'bold',
  textit: 'italic',
  emph: 'italic',
  underline: 'underline',
  uline: 'underline',
  sout: 'strike',
  texttt: 'code',
  textsubscript: 'subscript',
  textsuperscript: 'superscript',
  hl: 'highlight',
}

function mergeMark(node: InlineNode, mark: Mark): InlineNode {
  if (node.kind !== 'text') return node
  return { ...node, marks: [...(node.marks ?? []), mark] }
}

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let buffer = ''
  const flush = () => {
    if (buffer) {
      nodes.push({ kind: 'text', text: unescapeLatex(buffer) })
      buffer = ''
    }
  }

  let i = 0
  while (i < text.length) {
    const ch = text[i]

    // Inline math: $...$ or \(...\)
    if (ch === '$') {
      const end = text.indexOf('$', i + 1)
      if (end !== -1) {
        flush()
        nodes.push({ kind: 'inlineMath', latex: text.slice(i + 1, end) })
        i = end + 1
        continue
      }
    }
    if (ch === '\\' && text[i + 1] === '(') {
      const end = text.indexOf('\\)', i + 2)
      if (end !== -1) {
        flush()
        nodes.push({ kind: 'inlineMath', latex: text.slice(i + 2, end) })
        i = end + 2
        continue
      }
    }

    if (ch === '\\') {
      const next = text[i + 1]
      // Escaped literal character, e.g. \% \& \_ \{ \} \$ \~ \^
      if (next && !/[a-zA-Z]/.test(next)) {
        buffer += next
        i += 2
        continue
      }
      // Command name
      const match = /^\\([a-zA-Z]+)/.exec(text.slice(i))
      if (match) {
        const name = match[1]
        let cursor = i + match[0].length
        cursor = skipWhitespace(text, cursor)

        if (name === 'href') {
          const arg1 = text[cursor] === '{' ? extractBraced(text, cursor) : null
          if (arg1) {
            const afterArg1 = skipWhitespace(text, arg1.endIndex + 1)
            const arg2 = text[afterArg1] === '{' ? extractBraced(text, afterArg1) : null
            if (arg2) {
              flush()
              const inner = parseInline(arg2.content)
              const mark: Mark = { type: 'link', attrs: { href: arg1.content } }
              nodes.push(...inner.map((n) => mergeMark(n, mark)))
              i = arg2.endIndex + 1
              continue
            }
          }
        }

        if (name === 'textcolor' || name === 'colorbox') {
          // Both take an optional [HTML]/[rgb]/[RGB] model before the color
          // argument, then a second brace group with the actual content.
          const colorSpec = parseLatexColorArg(text, cursor, extractBraced, skipWhitespace)
          if (colorSpec) {
            const afterColor = skipWhitespace(text, colorSpec.endIndex + 1)
            const arg2 = text[afterColor] === '{' ? extractBraced(text, afterColor) : null
            if (arg2) {
              flush()
              const inner = parseInline(arg2.content)
              const mark: Mark = { type: name === 'textcolor' ? 'color' : 'highlight', attrs: { color: colorSpec.color } }
              nodes.push(...inner.map((n) => mergeMark(n, mark)))
              i = arg2.endIndex + 1
              continue
            }
          }
        }

        const markType = WRAP_COMMANDS[name]
        if (markType && text[cursor] === '{') {
          const arg = extractBraced(text, cursor)
          if (arg) {
            flush()
            const inner = parseInline(arg.content)
            const mark: Mark = { type: markType }
            nodes.push(...inner.map((n) => mergeMark(n, mark)))
            i = arg.endIndex + 1
            continue
          }
        }

        // Unknown / unsupported inline command: preserve the raw source
        // verbatim (including its argument, if any) rather than dropping it.
        if (text[cursor] === '{') {
          const arg = extractBraced(text, cursor)
          if (arg) {
            buffer += text.slice(i, arg.endIndex + 1)
            i = arg.endIndex + 1
            continue
          }
        }
        buffer += match[0]
        i += match[0].length
        continue
      }
    }

    buffer += ch
    i++
  }
  flush()
  return nodes
}

// -------------------------------------------------------------------------
// Block splitting: walk line-by-line, keeping `\begin{}...\end{}` and
// `\[...\]` spans intact as one chunk regardless of blank lines inside them.
// -------------------------------------------------------------------------
interface RawBlock {
  text: string
  startLine: number
}

function splitIntoBlocks(body: string): RawBlock[] {
  const lines = body.split('\n')
  const blocks: RawBlock[] = []
  let current: string[] = []
  let currentStart = 0
  let envDepth = 0
  let inDisplayMath = false

  const flush = () => {
    const joined = current.join('\n').trim()
    if (joined) blocks.push({ text: joined, startLine: currentStart })
    current = []
  }

  lines.forEach((line, idx) => {
    const beginMatches = line.match(/\\begin\{[^}]+\}/g) ?? []
    const endMatches = line.match(/\\end\{[^}]+\}/g) ?? []
    const trimmed = line.trim()

    if (current.length === 0) currentStart = idx

    if (envDepth === 0 && !inDisplayMath && trimmed === '' ) {
      flush()
      return
    }

    current.push(line)
    envDepth += beginMatches.length - endMatches.length
    if (envDepth < 0) envDepth = 0

    if (trimmed === '\\[') inDisplayMath = true
    else if (trimmed === '\\]') inDisplayMath = false
  })
  flush()
  return blocks
}

// -------------------------------------------------------------------------
// List item splitting (handles one level of nested itemize/enumerate)
// -------------------------------------------------------------------------
function splitListItems(inner: string): string[] {
  const lines = inner.split('\n')
  const items: string[] = []
  let current: string[] | null = null
  let depth = 0
  for (const line of lines) {
    if (/\\begin\{(itemize|enumerate)\}/.test(line)) depth++
    if (/\\end\{(itemize|enumerate)\}/.test(line)) depth--
    if (depth === 0 && /^\s*\\item\b/.test(line)) {
      if (current) items.push(current.join('\n'))
      current = [line.replace(/^\s*\\item\s*/, '')]
    } else if (current !== null) {
      current.push(line)
    }
  }
  if (current) items.push(current.join('\n'))
  return items
}

// Finds the \begin{name}...\end{name} span matching same-name nesting depth
// (e.g. itemize inside itemize). Uses plain indexOf rather than a RegExp
// built from `name`, since names like "align*" contain regex metacharacters.
function findEnvSpan(text: string, name: string): { inner: string; before: string; after: string } | null {
  const beginTag = `\\begin{${name}}`
  const endTag = `\\end{${name}}`
  const start = text.indexOf(beginTag)
  if (start === -1) return null
  let depth = 1
  let cursor = start + beginTag.length
  while (cursor < text.length) {
    const nextBegin = text.indexOf(beginTag, cursor)
    const nextEnd = text.indexOf(endTag, cursor)
    if (nextEnd === -1) return null
    if (nextBegin !== -1 && nextBegin < nextEnd) {
      depth++
      cursor = nextBegin + beginTag.length
    } else {
      depth--
      cursor = nextEnd + endTag.length
      if (depth === 0) {
        return {
          before: text.slice(0, start),
          inner: text.slice(start + beginTag.length, nextEnd),
          after: text.slice(cursor),
        }
      }
    }
  }
  return null
}

// `segment` has already had any leading task-checkbox marker stripped by
// parseListItem. This only needs to handle plain content vs. a nested list.
function parseListItemContent(segment: string): BlockNode[] {
  const nestedItemize = findEnvSpan(segment, 'itemize')
  const nestedEnumerate = findEnvSpan(segment, 'enumerate')
  const nested = nestedItemize ?? nestedEnumerate
  const blocks: BlockNode[] = []
  if (nested) {
    const beforeText = nested.before.trim()
    if (beforeText) blocks.push({ kind: 'paragraph', content: parseInline(beforeText) })
    blocks.push(
      nestedItemize
        ? { kind: 'bulletList', items: splitListItems(nested.inner).map(parseListItem) }
        : { kind: 'orderedList', items: splitListItems(nested.inner).map(parseListItem) },
    )
    const afterText = nested.after.trim()
    if (afterText) blocks.push({ kind: 'paragraph', content: parseInline(afterText) })
  } else {
    blocks.push({ kind: 'paragraph', content: parseInline(segment.trim()) })
  }
  return blocks
}

function parseListItem(segment: string): ListItemNode {
  let task = false
  let checked = false
  let rest = segment
  const boxMatch = /^\s*\[\$\\boxtimes\$\]\s*/.exec(rest) || /^\s*\[x\]\s*/i.exec(rest)
  const squareMatch = /^\s*\[\$\\square\$\]\s*/.exec(rest) || /^\s*\[\s?\]\s*/.exec(rest)
  if (boxMatch) {
    task = true
    checked = true
    rest = rest.slice(boxMatch[0].length)
  } else if (squareMatch) {
    task = true
    checked = false
    rest = rest.slice(squareMatch[0].length)
  }
  const content = parseListItemContent(rest)
  return task ? { content, checked } : { content }
}

// -------------------------------------------------------------------------
// Block parsing
// -------------------------------------------------------------------------
const HEADING_COMMANDS: Record<string, 1 | 2 | 3 | 4> = {
  section: 1,
  subsection: 2,
  subsubsection: 3,
  paragraph: 4,
}

function parseTable(inner: string): BlockNode {
  const tabular = findEnvSpan(inner, 'tabular')
  const captionMatch = /\\caption\{([\s\S]*?)\}/.exec(inner)
  const caption = captionMatch ? unescapeLatex(captionMatch[1]) : undefined
  if (!tabular) return { kind: 'table', rows: [], caption }

  const rowLines = tabular.inner
    .split('\\\\')
    .map((r) => r.trim())
    .filter((r) => r && !/^\\hline$/.test(r))

  const rows: TableRowNode[] = rowLines.map((line, rowIdx) => {
    const cells = line
      .replace(/\\hline/g, '')
      .split('&')
      .map((c) => c.trim())
    return {
      cells: cells.map((c) => ({
        content: [{ kind: 'paragraph', content: parseInline(c) }],
        header: rowIdx === 0,
      })),
    }
  })
  return { kind: 'table', rows, caption }
}

function parseFigure(inner: string): BlockNode {
  const srcMatch = /\\includegraphics(?:\[[^\]]*\])?\{([^}]*)\}/.exec(inner)
  const captionMatch = /\\caption\{([\s\S]*?)\}/.exec(inner)
  const widthMatch = /\\includegraphics\[width=([\d.]+)\\linewidth\]/.exec(inner)
  return {
    kind: 'image',
    src: srcMatch?.[1] ?? '',
    caption: captionMatch ? unescapeLatex(captionMatch[1]) : undefined,
    width: widthMatch ? parseFloat(widthMatch[1]) : undefined,
  }
}

export function parseBlock(raw: RawBlock, diagnostics: Diagnostic[]): BlockNode {
  const text = raw.text
  const line = raw.startLine + 1

  try {
    for (const [cmd, level] of Object.entries(HEADING_COMMANDS)) {
      const re = new RegExp(`^\\\\${cmd}\\*?\\s*\\{`)
      const m = re.exec(text)
      if (m) {
        const arg = extractBraced(text, m[0].length - 1)
        if (arg) return { kind: 'heading', level, content: parseInline(arg.content) }
      }
    }

    if (/^\\begin\{itemize\}/.test(text)) {
      const span = findEnvSpan(text, 'itemize')
      if (span) {
        const items = splitListItems(span.inner).map(parseListItem)
        const task = items.length > 0 && items.every((it) => it.checked !== undefined)
        return { kind: 'bulletList', items, task }
      }
      diagnostics.push({ line, message: 'Unclosed \\begin{itemize} environment', severity: 'error' })
    }

    if (/^\\begin\{enumerate\}/.test(text)) {
      const span = findEnvSpan(text, 'enumerate')
      if (span) return { kind: 'orderedList', items: splitListItems(span.inner).map(parseListItem) }
      diagnostics.push({ line, message: 'Unclosed \\begin{enumerate} environment', severity: 'error' })
    }

    if (/^\\begin\{quote\}/.test(text)) {
      const span = findEnvSpan(text, 'quote')
      if (span) {
        const inner = splitIntoBlocks(span.inner).map((b) => parseBlock(b, diagnostics))
        return { kind: 'quote', content: inner }
      }
    }

    if (/^\\begin\{verbatim\}/.test(text)) {
      const span = findEnvSpan(text, 'verbatim')
      if (span) return { kind: 'codeBlock', code: span.inner.replace(/^\n/, '').replace(/\n$/, '') }
    }

    if (/^\\begin\{lstlisting\}/.test(text)) {
      const span = findEnvSpan(text, 'lstlisting')
      if (span) return { kind: 'codeBlock', code: span.inner.replace(/^\n/, '').replace(/\n$/, '') }
    }

    if (/^\\begin\{table\}/.test(text)) {
      const span = findEnvSpan(text, 'table')
      if (span) return parseTable(span.inner)
    }

    if (/^\\begin\{figure\}/.test(text)) {
      const span = findEnvSpan(text, 'figure')
      if (span) return parseFigure(span.inner)
    }

    if (text.startsWith('\\[') && text.endsWith('\\]')) {
      return { kind: 'equation', latex: text.slice(2, -2).trim() }
    }

    for (const env of ['equation', 'align', 'gather'] as const) {
      if (new RegExp(`^\\\\begin\\{${env}\\*?\\}`).test(text)) {
        const span = findEnvSpan(text, env) ?? findEnvSpan(text, `${env}*`)
        if (span) {
          const labelMatch = /\\label\{([^}]*)\}/.exec(span.inner)
          const latex = span.inner.replace(/\\label\{[^}]*\}\n?/, '').trim()
          return {
            kind: 'equation',
            latex,
            numbered: true,
            environment: env,
            label: labelMatch?.[1],
          }
        }
      }
    }

    if (/^\\(hrulefill|noindent\\hrulefill|par\\noindent\\hrulefill\\par)/.test(text) || text === '\\hrulefill') {
      return { kind: 'horizontalRule' }
    }

    if (/^\\(newpage|pagebreak|clearpage)\b/.test(text)) {
      return { kind: 'pageBreak' }
    }

    if (/^\\begin\{/.test(text)) {
      const nameMatch = /^\\begin\{([^}]+)\}/.exec(text)
      diagnostics.push({
        line,
        message: `Unsupported LaTeX environment: \\begin{${nameMatch?.[1] ?? '?'}}`,
        severity: 'warning',
      })
      return { kind: 'unsupported', raw: text, reason: 'Unsupported environment' }
    }

    // Default: plain paragraph of inline content.
    return { kind: 'paragraph', content: parseInline(text) }
  } catch (err) {
    diagnostics.push({
      line,
      message: `Failed to parse block: ${err instanceof Error ? err.message : String(err)}`,
      severity: 'error',
    })
    return { kind: 'unsupported', raw: text, reason: 'Parse error' }
  }
}

// -------------------------------------------------------------------------
// Top-level entry point
// -------------------------------------------------------------------------
export function parseLatexDocument(source: string): ParseResult {
  const diagnostics: Diagnostic[] = []
  const doc = createEmptyDocument()

  try {
    const classMatch = /\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/.exec(source)
    if (classMatch) {
      doc.preamble.documentClassOptions = classMatch[1] || undefined
      doc.preamble.documentClass = classMatch[2]
    }
    const packages = [...source.matchAll(/\\usepackage(?:\[[^\]]*\])?\{([^}]*)\}/g)].flatMap((m) =>
      m[1].split(',').map((p) => p.trim()),
    )
    if (packages.length) doc.preamble.packages = packages
    else doc.preamble.packages = [...DEFAULT_PREAMBLE.packages]

    const titleMatch = /\\title\{([\s\S]*?)\}/.exec(source)
    if (titleMatch) doc.metadata.title = unescapeLatex(titleMatch[1])
    const authorMatch = /\\author\{([\s\S]*?)\}/.exec(source)
    if (authorMatch) doc.metadata.author = unescapeLatex(authorMatch[1])

    const docSpan = findEnvSpan(source, 'document')
    const body = docSpan ? docSpan.inner : source
    const bodyLineOffset = docSpan ? source.slice(0, source.indexOf(docSpan.inner)).split('\n').length - 1 : 0

    const cleanedBody = body.replace(/\\maketitle/g, '').trim()
    const rawBlocks = splitIntoBlocks(cleanedBody)
    const content = rawBlocks.map((b) =>
      parseBlock({ text: b.text, startLine: b.startLine + bodyLineOffset }, diagnostics),
    )
    doc.content = content.length ? content : [{ kind: 'paragraph', content: [] }]
  } catch (err) {
    diagnostics.push({
      line: 1,
      message: `Document failed to parse: ${err instanceof Error ? err.message : String(err)}. Showing raw source as a single block.`,
      severity: 'error',
    })
    doc.content = [{ kind: 'unsupported', raw: source, reason: 'Top-level parse failure' }]
  }

  doc.metadata.updatedAt = new Date().toISOString()
  return { doc, diagnostics }
}
