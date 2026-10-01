import type {
  BlockNode,
  DocumentModel,
  InlineNode,
  ListItemNode,
  Mark,
  TableRowNode,
} from '../types/document'
import { escapeLatex } from './escapeLatex'

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
  highlight: (body) => `\\hl{${body}}`,
  link: (body, mark) => `\\href{${mark.attrs?.href ?? ''}}{${body}}`,
  color: (body, mark) => `\\textcolor{${mark.attrs?.color ?? 'black'}}{${body}}`,
}

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

export function documentToLatex(doc: DocumentModel, options: DocumentToLatexOptions = {}): string {
  const body = doc.content.map((b) => blockToLatex(b)).join('\n\n')
  if (!options.fullDocument) return body

  const { documentClass, documentClassOptions, packages, extra } = doc.preamble
  const opts = documentClassOptions ? `[${documentClassOptions}]` : ''
  const pkgLines = packages.map((p) => `\\usepackage{${p}}`).join('\n')
  const titleBlock = doc.metadata.title
    ? `\\title{${escapeLatex(doc.metadata.title)}}\n${
        doc.metadata.author ? `\\author{${escapeLatex(doc.metadata.author)}}\n` : ''
      }${doc.metadata.date ? `\\date{${escapeLatex(doc.metadata.date)}}\n` : ''}`
    : ''

  return [
    `\\documentclass${opts}{${documentClass}}`,
    '',
    pkgLines,
    extra ? `\n${extra}` : '',
    '',
    titleBlock,
    '\\begin{document}',
    '',
    titleBlock ? '\\maketitle\n' : '',
    body,
    '',
    '\\end{document}',
    '',
  ]
    .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
    .join('\n')
}
