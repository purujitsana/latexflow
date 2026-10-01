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

// A chunk that parsed to a paragraph with zero inline nodes only happens
// when its entire raw text was noop commands (\phantomsection,
// \addcontentsline{...}, bare \appendix, ...) — splitIntoBlocks never emits
// a chunk from blank lines alone, so this can't be a real blank paragraph
// the user wrote. Safe to drop rather than leaving empty clutter behind.
function isEmptyNoopParagraph(block: BlockNode): boolean {
  return block.kind === 'paragraph' && block.content.length === 0
}

// Commands that produce no visible text of their own (structural/typographic
// no-ops for our purposes — page numbering, TOC markers, spacing, layout
// declarations). Consumed and dropped so they don't leak as literal
// "\tableofcontents"-style text into the rendered document.
const NOOP_COMMANDS = new Set([
  'phantomsection',
  'tableofcontents',
  'listoffigures',
  'listoftables',
  'appendix',
  'maketitle',
  'centering',
  'raggedright',
  'raggedleft',
  'noindent',
  'clearpage',
  'newpage',
  'pagebreak',
  'par',
  'small',
  'large',
  'Large',
  'LARGE',
  'huge',
  'Huge',
  'normalsize',
  'bfseries',
  'itshape',
  'medskip',
  'smallskip',
  'bigskip',
])

// Same idea, but the command also takes a fixed number of brace-group
// arguments that must be consumed (and discarded) along with it, e.g.
// \addcontentsline{toc}{section}{Abstract} or \pagenumbering{roman}.
const NOOP_COMMANDS_WITH_ARGS: Record<string, number> = {
  addcontentsline: 3,
  pagenumbering: 1,
  hypersetup: 1,
  setcounter: 2,
  renewcommand: 2,
  newcommand: 2,
  setstretch: 1,
  setlength: 2,
  vspace: 1,
  hspace: 1,
  linespread: 1,
  definecolor: 3,
  label: 1,
}

/** Consumes `count` leading `{...}` argument groups (tolerating an optional
 * `[...]` option before any of them) starting at `cursor`. Returns the index
 * just past the last consumed group, or null if the expected braces aren't there. */
function consumeBraceArgs(text: string, cursor: number, count: number): number | null {
  let i = cursor
  for (let k = 0; k < count; k++) {
    i = skipWhitespace(text, i)
    if (text[i] === '[') {
      const close = text.indexOf(']', i)
      if (close === -1) return null
      i = skipWhitespace(text, close + 1)
    }
    if (text[i] !== '{') return null
    const arg = extractBraced(text, i)
    if (!arg) return null
    i = arg.endIndex + 1
  }
  return i
}

/** Like `consumeBraceArgs`, but returns the text with the leading groups
 * removed rather than just an index — used to strip column-spec arguments
 * (e.g. the `{ll}` in `\begin{tabular}{ll}`) from an environment's `.inner`
 * before it's treated as row content. */
function stripLeadingBraceArgs(text: string, count: number): string {
  const end = consumeBraceArgs(text, 0, count)
  return end === null ? text : text.slice(end)
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
      // Command name (optionally starred, e.g. \vspace*{1cm})
      const match = /^\\([a-zA-Z]+)(\*)?/.exec(text.slice(i))
      if (match) {
        const name = match[1]
        const bareEnd = i + match[0].length
        let cursor = skipWhitespace(text, bareEnd)

        if (NOOP_COMMANDS.has(name)) {
          // Chunks are only ever split on blank lines (never single ones),
          // so eating one trailing newline here can't accidentally merge
          // into a different paragraph — it just stops a run of noop
          // commands on consecutive lines from leaving literal blank lines
          // behind in the resulting text.
          i = text[bareEnd] === '\n' ? bareEnd + 1 : bareEnd
          continue
        }
        if (name in NOOP_COMMANDS_WITH_ARGS) {
          const end = consumeBraceArgs(text, cursor, NOOP_COMMANDS_WITH_ARGS[name])
          if (end !== null) {
            i = text[end] === '\n' ? end + 1 : end
            continue
          }
        }

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
// Block splitting.
//
// This does NOT just split on blank lines. Real hand-written LaTeX (as
// opposed to our own generator's output) routinely packs \section,
// \subsection, \begin{table}, etc. back-to-back on consecutive lines with
// no blank line between them at all — blank lines only separate prose
// paragraphs, not structural commands. A purely blank-line-based splitter
// merges an entire section (heading + every table in it) into one opaque
// chunk, which then fails every block-type check and quietly loses that
// content instead of rendering it.
//
// So a line starting a new structural construct (heading, \begin{...},
// \[, or a bare hrule/pagebreak command) always starts its own chunk, even
// without a blank line before it; `\end{...}` closing back to depth 0, or a
// self-contained single-line construct, closes a chunk immediately after.
// Blank lines still separate ordinary prose paragraphs as before.
// -------------------------------------------------------------------------
interface RawBlock {
  text: string
  startLine: number
}

const HEADING_START_RE = /^\\(section|subsection|subsubsection|paragraph)\*?\s*\{/
const BARE_COMMAND_RE = /^\\(hrulefill|newpage|pagebreak|clearpage)\b/
const BLOCK_START_RE = new RegExp(
  `^(${HEADING_START_RE.source}|\\\\begin\\{[a-zA-Z*]+\\}|\\\\\\[|${BARE_COMMAND_RE.source})`,
)

function isBraceBalanced(s: string): boolean {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') {
      i++
      continue
    }
    if (s[i] === '{') depth++
    else if (s[i] === '}') depth--
  }
  return depth <= 0
}

export function splitIntoBlocks(body: string): RawBlock[] {
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

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    const trimmed = line.trim()

    if (envDepth === 0 && !inDisplayMath) {
      if (trimmed === '') {
        flush()
        continue
      }
      if (current.length > 0 && BLOCK_START_RE.test(trimmed)) {
        flush()
      }
    }

    if (current.length === 0) currentStart = idx
    current.push(line)

    const begins = trimmed.match(/\\begin\{[a-zA-Z*]+\}/g) ?? []
    const ends = trimmed.match(/\\end\{[a-zA-Z*]+\}/g) ?? []
    envDepth += begins.length - ends.length
    if (envDepth < 0) envDepth = 0

    if (trimmed === '\\[') inDisplayMath = true
    else if (trimmed === '\\]') inDisplayMath = false

    if (envDepth === 0 && !inDisplayMath) {
      const closedEnv = ends.length > 0
      const isHeading = HEADING_START_RE.test(current[0].trim()) && isBraceBalanced(current.join('\n'))
      const isBareCommand = current.length === 1 && BARE_COMMAND_RE.test(current[0].trim())
      if (closedEnv || isHeading || isBareCommand) flush()
    }
  }
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

// `tabular{spec}` has one leading brace argument (the column spec) before
// row content starts; `tabularx{width}{spec}` has two (width, then spec);
// `longtable{spec}` has one, same as tabular. Skipping the wrong number
// leaves the spec's own text (e.g. "{ll}") glued onto the first cell.
const TABLE_GRID_ENVS: { name: string; argsToStrip: number }[] = [
  { name: 'tabular', argsToStrip: 1 },
  { name: 'tabularx', argsToStrip: 2 },
  { name: 'longtable', argsToStrip: 1 },
]

function findTableGrid(text: string): { inner: string; argsToStrip: number } | null {
  for (const { name, argsToStrip } of TABLE_GRID_ENVS) {
    const span = findEnvSpan(text, name)
    if (span) return { inner: span.inner, argsToStrip }
  }
  return null
}

// longtable repeats its header between \endfirsthead/\endhead (and
// optionally a footer between \endfoot/\endlastfoot) for multi-page
// breaks; neither is a real data row, so collapse to a single header
// copy followed by the actual body rows.
function resolveLongtableSections(body: string): string {
  const endHeadIdx = body.indexOf('\\endhead')
  if (endHeadIdx === -1) return body
  const firstHeadIdx = body.indexOf('\\endfirsthead')
  const headerSegment = firstHeadIdx !== -1 ? body.slice(firstHeadIdx + '\\endfirsthead'.length, endHeadIdx) : ''
  let dataSegment = body.slice(endHeadIdx + '\\endhead'.length)
  const footIdx = dataSegment.search(/\\endfoot|\\endlastfoot/)
  if (footIdx !== -1) dataSegment = dataSegment.slice(0, footIdx)
  return `${headerSegment}\n${dataSegment}`
}

// Strips row-decoration commands (booktabs rules, per-row background color)
// that aren't cell content, so they don't leak into a cell's text.
function cleanRowLine(line: string): string {
  return line.replace(/\\(hline|toprule|midrule|bottomrule)\b/g, '').replace(/\\rowcolor\{[^}]*\}/g, '')
}

function parseTable(inner: string): BlockNode {
  const captionMatch = /\\caption\{([\s\S]*?)\}/.exec(inner)
  const caption = captionMatch ? unescapeLatex(captionMatch[1]) : undefined

  const grid = findTableGrid(inner)
  if (!grid) return { kind: 'table', rows: [], caption }

  let body = stripLeadingBraceArgs(grid.inner, grid.argsToStrip)
  body = resolveLongtableSections(body)
  // longtable keeps \caption/\label inside the grid itself (tabular/tabularx
  // never do); strip them here so they don't surface as a stray row.
  body = body.replace(/\\caption\{[\s\S]*?\}/g, '').replace(/\\label\{[^}]*\}/g, '')

  const rowLines = body
    .split('\\\\')
    .map((r) => cleanRowLine(r).trim())
    .filter((r) => r.length > 0)

  const rows: TableRowNode[] = rowLines.map((line, rowIdx) => {
    const cells = line.split('&').map((c) => c.trim())
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

// \begin{thebibliography}{99} ... \bibitem{key} text ... \end{thebibliography}
// has no real document-model equivalent, so it's mapped to an ordered list —
// close enough semantically (a numbered reference list) without inventing a
// new block type for a single construct.
function parseBibliography(inner: string): BlockNode {
  const body = stripLeadingBraceArgs(inner, 1)
  const entries = body
    .split(/\\bibitem(?:\[[^\]]*\])?\{[^}]*\}/)
    .map((e) => e.trim())
    .filter(Boolean)
  return {
    kind: 'orderedList',
    items: entries.map((e) => ({ content: [{ kind: 'paragraph', content: parseInline(e) }] })),
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
        const inner = splitIntoBlocks(span.inner)
          .map((b) => parseBlock(b, diagnostics))
          .filter((b) => !isEmptyNoopParagraph(b))
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

    // tabular/tabularx/longtable can also appear without a \begin{table}
    // wrapper (common for appendix link lists, summary grids, etc.).
    // parseTable searches `text` itself for whichever grid env is present.
    if (/^\\begin\{(tabular|tabularx|longtable)\}/.test(text)) {
      return parseTable(text)
    }

    if (/^\\begin\{figure\}/.test(text)) {
      const span = findEnvSpan(text, 'figure')
      if (span) return parseFigure(span.inner)
    }

    if (/^\\begin\{thebibliography\}/.test(text)) {
      const span = findEnvSpan(text, 'thebibliography')
      if (span) return parseBibliography(span.inner)
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
    const content = rawBlocks
      .map((b) => parseBlock({ text: b.text, startLine: b.startLine + bodyLineOffset }, diagnostics))
      .filter((b) => !isEmptyNoopParagraph(b))
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
