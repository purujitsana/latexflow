import type {
  BlockNode,
  DocumentModel,
  InlineNode,
  ListItemNode,
  Mark,
  TableRowNode,
} from '../types/document'
import { escapeLatex } from './escapeLatex'
import { toLatexColorArg } from './latexColor'

export interface DocumentToLatexOptions {
  /** Wrap content in \documentclass/\begin{document}/\end{document}. */
  fullDocument?: boolean
}

const MARK_WRAPPERS: Partial<Record<Mark['type'], (body: string, mark: Mark) => string>> = {
  bold: (body) => `\\textbf{${body}}`,
  italic: (body) => `\\textit{${body}}`,
  underline: (body) => `\\underline{${body}}`,
  strike: (body) => `\\sout{${body}}`,
  code: (body) => `\\texttt{${body}}`,
  subscript: (body) => `\\textsubscript{${body}}`,
  superscript: (body) => `\\textsuperscript{${body}}`,
  // \colorbox (xcolor) rather than \hl (soul): it takes a color argument
  // directly, matching our per-instance multicolor highlight marks, and
  // needs no extra package beyond the one \textcolor already requires.
  highlight: (body, mark) => `\\colorbox${toLatexColorArg(mark.attrs?.color ?? '#fff2a8')}{${body}}`,
  link: (body, mark) => `\\href{${mark.attrs?.href ?? ''}}{${body}}`,
  color: (body, mark) => `\\textcolor${toLatexColorArg(mark.attrs?.color ?? 'black')}{${body}}`,
}

// Packages required by specific generated commands, auto-injected based on
// what the body actually uses. This also self-heals documents saved before
// a given mark's package dependency was added to DEFAULT_PREAMBLE.
const CONDITIONAL_PACKAGES: { test: RegExp; package: string }[] = [
  { test: /\\textcolor|\\colorbox/, package: 'xcolor' },
  { test: /\\sout\{/, package: 'ulem' },
]

// Marks nest deterministically outside-in so the generator is stable across
// runs (otherwise semantically-identical text could serialize differently
// depending on object key order, which breaks round-trip tests).
const MARK_ORDER: Mark['type'][] = [
  'link',
  'color',
  'highlight',
  'bold',
  'italic',
  'underline',
  'strike',
  'subscript',
  'superscript',
  'code',
]

function inlineToLatex(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === 'inlineMath') return `$${node.latex}$`
      let body = escapeLatex(node.text)
      const marks = [...(node.marks ?? [])].sort(
        (a, b) => MARK_ORDER.indexOf(a.type) - MARK_ORDER.indexOf(b.type),
      )
      for (const mark of marks) {
        const wrap = MARK_WRAPPERS[mark.type]
        if (wrap) body = wrap(body, mark)
      }
      return body
    })
    .join('')
}

function alignWrap(align: string | undefined, body: string): string {
  switch (align) {
    case 'center':
      return `\\begin{center}\n${body}\n\\end{center}`
    case 'right':
      return `\\begin{flushright}\n${body}\n\\end{flushright}`
    case 'left':
      return `\\begin{flushleft}\n${body}\n\\end{flushleft}`
    default:
      return body
  }
}

function listItemsToLatex(items: ListItemNode[], task: boolean, indent: string): string {
  return items
    .map((item) => {
      const marker = task ? `[${item.checked ? '$\\boxtimes$' : '$\\square$'}] ` : ''
      if (item.content.length === 0) return `${indent}\\item ${marker}`.trimEnd()
      const [first, ...rest] = item.content
      // The first block sits inline after \item; nested blocks (e.g. a
      // sub-list) render on their own indented lines below it.
      const firstText =
        first.kind === 'paragraph' || first.kind === 'heading' ? inlineToLatex(first.content) : blockToLatex(first)
      const restText = rest.map((b) => blockToLatex(b, indent + '    ')).join('\n')
      return [`${indent}\\item ${marker}${firstText}`, restText].filter(Boolean).join('\n')
    })
    .join('\n')
}

function tableRowToLatex(row: TableRowNode): string {
  return row.cells
    .map((cell) => cell.content.map((b) => inlineOnlyText(b)).join(' '))
    .join(' & ')
}

// Table cells are typeset as a single LaTeX line, so nested block content is
// flattened to its inline text rather than recursing into blockToLatex.
function inlineOnlyText(block: BlockNode): string {
  if (block.kind === 'paragraph' || block.kind === 'heading') {
    return inlineToLatex(block.content)
  }
  if (block.kind === 'unsupported') return block.raw
  return ''
}

export function blockToLatex(block: BlockNode, indent = ''): string {
  switch (block.kind) {
    case 'paragraph': {
      if (block.content.length === 0) return ''
      const text = inlineToLatex(block.content)
      return indent + alignWrap(block.align, text)
    }
    case 'heading': {
      const cmd = ['section', 'subsection', 'subsubsection', 'paragraph'][block.level - 1]
      return `${indent}\\${cmd}{${inlineToLatex(block.content)}}`
    }
    case 'bulletList':
      return [
        `${indent}\\begin{itemize}`,
        listItemsToLatex(block.items, !!block.task, indent + '    '),
        `${indent}\\end{itemize}`,
      ].join('\n')
    case 'orderedList':
      return [
        `${indent}\\begin{enumerate}`,
        listItemsToLatex(block.items, false, indent + '    '),
        `${indent}\\end{enumerate}`,
      ].join('\n')
    case 'quote':
      return [
        `${indent}\\begin{quote}`,
        block.content.map((b) => blockToLatex(b, indent + '    ')).join('\n'),
        `${indent}\\end{quote}`,
      ].join('\n')
    case 'codeBlock':
      return [`${indent}\\begin{verbatim}`, block.code, `${indent}\\end{verbatim}`].join('\n')
    case 'equation': {
      if (!block.numbered && (!block.environment || block.environment === 'equation')) {
        return `${indent}\\[\n${block.latex}\n\\]`
      }
      const env = block.environment ?? 'equation'
      const label = block.label ? `\\label{${block.label}}\n` : ''
      return [`${indent}\\begin{${env}}`, `${label}${block.latex}`, `${indent}\\end{${env}}`].join('\n')
    }
    case 'table': {
      const colCount = Math.max(1, ...block.rows.map((r) => r.cells.length))
      const spec = 'l'.repeat(colCount)
      const lines = [`${indent}\\begin{table}[h]`, `${indent}\\centering`, `${indent}\\begin{tabular}{${spec}}`]
      block.rows.forEach((row, i) => {
        lines.push(`${indent}    ${tableRowToLatex(row)} \\\\`)
        if (i === 0 && row.cells.some((c) => c.header)) lines.push(`${indent}    \\hline`)
      })
      lines.push(`${indent}\\end{tabular}`)
      if (block.caption) lines.push(`${indent}\\caption{${escapeLatex(block.caption)}}`)
      lines.push(`${indent}\\end{table}`)
      return lines.join('\n')
    }
    case 'image': {
      const lines = [`${indent}\\begin{figure}[h]`, `${indent}\\centering`]
      const widthOpt = block.width ? `[width=${block.width}\\linewidth]` : ''
      lines.push(`${indent}\\includegraphics${widthOpt}{${block.src}}`)
      if (block.caption) lines.push(`${indent}\\caption{${escapeLatex(block.caption)}}`)
      lines.push(`${indent}\\end{figure}`)
      return lines.join('\n')
    }
    case 'horizontalRule':
      return `${indent}\\par\\noindent\\hrulefill\\par`
    case 'pageBreak':
      return `${indent}\\newpage`
    case 'unsupported':
      return block.raw
    default:
      return ''
  }
}

/** 1-indexed, inclusive source-line range a block occupies in generated LaTeX. */
export interface BlockLineRange {
  start: number
  end: number
}

function rangesForBlocks(blockTexts: string[], startLine: number): BlockLineRange[] {
  const ranges: BlockLineRange[] = []
  let line = startLine
  for (const t of blockTexts) {
    const lineCount = t.split('\n').length
    ranges.push({ start: line, end: line + lineCount - 1 })
    line += lineCount + 1 // +1 for the blank-line separator before the next block
  }
  return ranges
}

/**
 * Same output as `documentToLatex`, but also reports which source-line
 * range each `doc.content[i]` block ended up occupying — used to highlight
 * the corresponding LaTeX lines when the cursor moves in the document
 * editor. Block ranges are computed from the exact same pieces used to
 * build `text`, so they can never drift out of sync with what's displayed.
 */
export function documentToLatexWithRanges(
  doc: DocumentModel,
  options: DocumentToLatexOptions = {},
): { text: string; ranges: BlockLineRange[] } {
  const blockTexts = doc.content.map((b) => blockToLatex(b))

  if (!options.fullDocument) {
    return { text: blockTexts.join('\n\n'), ranges: rangesForBlocks(blockTexts, 1) }
  }

  const { documentClass, documentClassOptions, packages, extra } = doc.preamble
  const opts = documentClassOptions ? `[${documentClassOptions}]` : ''
  const body = blockTexts.join('\n\n')
  const requiredPackages = CONDITIONAL_PACKAGES.filter((c) => c.test.test(body)).map((c) => c.package)
  const allPackages = [...packages, ...requiredPackages.filter((p) => !packages.includes(p))]
  const pkgLines = allPackages.map((p) => `\\usepackage{${p}}`).join('\n')
  const titleBlock = doc.metadata.title
    ? `\\title{${escapeLatex(doc.metadata.title)}}\n${
        doc.metadata.author ? `\\author{${escapeLatex(doc.metadata.author)}}\n` : ''
      }${doc.metadata.date ? `\\date{${escapeLatex(doc.metadata.date)}}\n` : ''}`
    : ''

  const prefixParts = [
    `\\documentclass${opts}{${documentClass}}`,
    '',
    pkgLines,
    extra ? `\n${extra}` : '',
    '',
    titleBlock,
    '\\begin{document}',
    '',
    titleBlock ? '\\maketitle\n' : '',
  ]
  const collapseBlank = (line: string, i: number, arr: string[]) => !(line === '' && arr[i - 1] === '')
  const text = [...prefixParts, body, '', '\\end{document}', ''].filter(collapseBlank).join('\n')

  // The collapse-filter only ever compares adjacent elements, so filtering
  // the prefix alone yields exactly the same kept/dropped lines as filtering
  // the full array — which tells us precisely which line `body` starts on.
  const prefixLineCount = prefixParts.filter(collapseBlank).join('\n').split('\n').length
  const ranges = rangesForBlocks(blockTexts, prefixLineCount + 1)

  return { text, ranges }
}

export function documentToLatex(doc: DocumentModel, options: DocumentToLatexOptions = {}): string {
  return documentToLatexWithRanges(doc, options).text
}
