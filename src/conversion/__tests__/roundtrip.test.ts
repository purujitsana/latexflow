import { describe, expect, it } from 'vitest'
import { documentToLatex } from '../documentToLatex'
import { parseLatexDocument } from '../latexParser'
import { tiptapJsonToModel } from '../tiptapBridge'
import { createEmptyDocument, type DocumentModel } from '../../types/document'

function docLatexDoc(doc: DocumentModel): DocumentModel {
  const latex = documentToLatex(doc, { fullDocument: true })
  return parseLatexDocument(latex).doc
}

function cellText(cell: { content: DocumentModel['content'] }): string {
  return cell.content
    .map((b) => (b.kind === 'paragraph' ? b.content.map((n) => (n.kind === 'text' ? n.text : '')).join('') : ''))
    .join('')
}

function plainText(model: DocumentModel): string {
  return model.content
    .map((b) => {
      if (b.kind === 'paragraph' || b.kind === 'heading') {
        return b.content.map((n) => (n.kind === 'text' ? n.text : `$${n.latex}$`)).join('')
      }
      return ''
    })
    .join('\n')
}

describe('document -> latex -> document round trip', () => {
  it('preserves plain paragraph text', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Hello world' }] }]
    const back = docLatexDoc(doc)
    expect(plainText(back)).toBe('Hello world')
  })

  it('preserves bold marks', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Hello', marks: [{ type: 'bold' }] }] }]
    const latex = documentToLatex(doc)
    expect(latex).toContain('\\textbf{Hello}')
    const back = docLatexDoc(doc)
    const node = back.content[0]
    expect(node.kind).toBe('paragraph')
    if (node.kind === 'paragraph') {
      expect(node.content[0].kind).toBe('text')
      if (node.content[0].kind === 'text') {
        expect(node.content[0].text).toBe('Hello')
        expect(node.content[0].marks?.[0].type).toBe('bold')
      }
    }
  })

  it('preserves nested bold+italic', () => {
    const doc = createEmptyDocument()
    doc.content = [
      { kind: 'paragraph', content: [{ kind: 'text', text: 'Hi', marks: [{ type: 'bold' }, { type: 'italic' }] }] },
    ]
    const back = docLatexDoc(doc)
    const node = back.content[0]
    if (node.kind === 'paragraph' && node.content[0].kind === 'text') {
      const types = node.content[0].marks?.map((m) => m.type).sort()
      expect(types).toEqual(['bold', 'italic'])
    }
  })

  it('preserves headings', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'heading', level: 2, content: [{ kind: 'text', text: 'Introduction' }] }]
    const latex = documentToLatex(doc)
    expect(latex).toContain('\\subsection{Introduction}')
    const back = docLatexDoc(doc)
    expect(back.content[0].kind).toBe('heading')
    if (back.content[0].kind === 'heading') expect(back.content[0].level).toBe(2)
  })

  it('preserves bullet lists', () => {
    const doc = createEmptyDocument()
    doc.content = [
      {
        kind: 'bulletList',
        items: [
          { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Heart rate' }] }] },
          { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'SpO2' }] }] },
        ],
      },
    ]
    const back = docLatexDoc(doc)
    expect(back.content[0].kind).toBe('bulletList')
    if (back.content[0].kind === 'bulletList') {
      expect(back.content[0].items).toHaveLength(2)
    }
  })

  it('preserves inline math', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Speed: ' }, { kind: 'inlineMath', latex: 'v = d/t' }] }]
    const back = docLatexDoc(doc)
    const node = back.content[0]
    expect(node.kind).toBe('paragraph')
    if (node.kind === 'paragraph') {
      const math = node.content.find((n) => n.kind === 'inlineMath')
      expect(math?.kind).toBe('inlineMath')
      if (math?.kind === 'inlineMath') expect(math.latex).toBe('v = d/t')
    }
  })

  it('preserves display equations', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'equation', latex: 'F = ma' }]
    const back = docLatexDoc(doc)
    expect(back.content[0].kind).toBe('equation')
    if (back.content[0].kind === 'equation') expect(back.content[0].latex).toBe('F = ma')
  })

  it('preserves tables', () => {
    const doc = createEmptyDocument()
    doc.content = [
      {
        kind: 'table',
        rows: [
          {
            cells: [
              { header: true, content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Parameter' }] }] },
              { header: true, content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Value' }] }] },
            ],
          },
          {
            cells: [
              { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Heart Rate' }] }] },
              { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: '72' }] }] },
            ],
          },
        ],
      },
    ]
    const back = docLatexDoc(doc)
    expect(back.content[0].kind).toBe('table')
    if (back.content[0].kind === 'table') {
      expect(back.content[0].rows).toHaveLength(2)
      // Regression: the generator's own `{ll}` column spec used to leak into
      // the first cell's text (e.g. "{ll}\nParameter") because the parser
      // never skipped \begin{tabular}'s column-spec argument.
      expect(cellText(back.content[0].rows[0].cells[0])).toBe('Parameter')
      expect(cellText(back.content[0].rows[0].cells[1])).toBe('Value')
      expect(cellText(back.content[0].rows[1].cells[0])).toBe('Heart Rate')
      expect(cellText(back.content[0].rows[1].cells[1])).toBe('72')
    }
  })

  it('parses tabularx tables (not just plain tabular)', () => {
    const latex = String.raw`
\begin{table}[htbp]\centering\small
\caption{Comparison of existing solutions}\label{tab:literature}
\begin{tabularx}{\textwidth}{|Y|Y|Y|Y|}
\hline\rowcolor{lightaccent}\textbf{Source} & \textbf{Performance} & \textbf{Limitation} & \textbf{Implication} \\ \hline
Device A & Fast & Expensive & Reduce cost \\ \hline
\end{tabularx}\end{table}
`
    const { doc } = parseLatexDocument(latex)
    expect(doc.content[0].kind).toBe('table')
    if (doc.content[0].kind === 'table') {
      expect(doc.content[0].caption).toBe('Comparison of existing solutions')
      expect(doc.content[0].rows).toHaveLength(2)
      expect(cellText(doc.content[0].rows[0].cells[0])).toBe('Source')
      expect(cellText(doc.content[0].rows[1].cells[0])).toBe('Device A')
      expect(cellText(doc.content[0].rows[1].cells[2])).toBe('Expensive')
    }
  })

  it('parses longtable tables with repeated-header markers', () => {
    const latex = String.raw`
\begin{longtable}{|L{0.42\textwidth}|L{0.49\textwidth}|}
\caption{Supporting project deliverables}\label{tab:links}\\
\hline\rowcolor{lightaccent}\textbf{Deliverable} & \textbf{URL / Access Status} \\ \hline
\endfirsthead
\hline\rowcolor{lightaccent}\textbf{Deliverable} & \textbf{URL / Access Status} \\ \hline
\endhead
IS-0 Project Proposal Approval & Pending \\ \hline
Final Demonstration Video & Uploaded \\ \hline
\end{longtable}
`
    const { doc } = parseLatexDocument(latex)
    expect(doc.content[0].kind).toBe('table')
    if (doc.content[0].kind === 'table') {
      expect(doc.content[0].rows).toHaveLength(3)
      expect(cellText(doc.content[0].rows[0].cells[0])).toBe('Deliverable')
      expect(cellText(doc.content[0].rows[1].cells[0])).toBe('IS-0 Project Proposal Approval')
      expect(cellText(doc.content[0].rows[2].cells[1])).toBe('Uploaded')
    }
  })

  it('parses \\begin{thebibliography} as a numbered reference list', () => {
    const latex = String.raw`
\begin{thebibliography}{99}
\bibitem{smith2020} J. Smith, "A Study," Journal of Things, 2020.
\bibitem{doe2019} A. Doe, "Another Study," 2019.
\end{thebibliography}
`
    const { doc } = parseLatexDocument(latex)
    expect(doc.content[0].kind).toBe('orderedList')
    if (doc.content[0].kind === 'orderedList') {
      expect(doc.content[0].items).toHaveLength(2)
    }
  })

  it('drops structural no-op commands instead of leaking literal braces', () => {
    const latex = String.raw`
\phantomsection\addcontentsline{toc}{section}{Abstract}
\tableofcontents
\pagenumbering{roman}
Real paragraph text survives.
`
    const { doc } = parseLatexDocument(latex)
    // Only the real paragraph should remain; the noop-only lines are dropped
    // entirely rather than showing up as stray "{toc}{section}" paragraphs.
    expect(doc.content).toHaveLength(1)
    expect(plainText(doc)).toBe('Real paragraph text survives.')
  })

  it('escapes and restores special characters', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: '50% of $100 & #1 rule_here' }] }]
    const latex = documentToLatex(doc)
    expect(latex).not.toContain('50%') // % must be escaped
    const back = docLatexDoc(doc)
    expect(plainText(back)).toBe('50% of $100 & #1 rule_here')
  })

  it('generates valid \\textcolor syntax for hex colors and pulls in xcolor', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Hi', marks: [{ type: 'color', attrs: { color: '#2f6fed' } }] }] }]
    const latex = documentToLatex(doc, { fullDocument: true })
    expect(latex).toContain('\\textcolor[HTML]{2F6FED}{Hi}')
    expect(latex).not.toContain('\\textcolor{#2f6fed}')
    expect(latex).toContain('\\usepackage{xcolor}')
  })

  it('generates \\colorbox (not \\hl) for highlight marks', () => {
    const doc = createEmptyDocument()
    doc.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Hi', marks: [{ type: 'highlight', attrs: { color: '#fff2a8' } }] }] }]
    const latex = documentToLatex(doc, { fullDocument: true })
    expect(latex).toContain('\\colorbox[HTML]{FFF2A8}{Hi}')
    expect(latex).not.toContain('\\hl{')
  })

  it('adds ulem only when strikethrough is actually used', () => {
    const plain = createEmptyDocument()
    plain.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Hi' }] }]
    expect(documentToLatex(plain, { fullDocument: true })).not.toContain('ulem')

    const struck = createEmptyDocument()
    struck.content = [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Hi', marks: [{ type: 'strike' }] }] }]
    expect(documentToLatex(struck, { fullDocument: true })).toContain('\\usepackage{ulem}')
  })

  it('round-trips color and highlight marks through LaTeX and back', () => {
    const doc = createEmptyDocument()
    doc.content = [
      {
        kind: 'paragraph',
        content: [
          { kind: 'text', text: 'Colored', marks: [{ type: 'color', attrs: { color: '#2f6fed' } }] },
          { kind: 'text', text: ' and ' },
          { kind: 'text', text: 'highlighted', marks: [{ type: 'highlight', attrs: { color: '#fff2a8' } }] },
        ],
      },
    ]
    const back = docLatexDoc(doc)
    const node = back.content[0]
    expect(node.kind).toBe('paragraph')
    if (node.kind === 'paragraph') {
      const colored = node.content.find((n) => n.kind === 'text' && n.text === 'Colored')
      const highlighted = node.content.find((n) => n.kind === 'text' && n.text === 'highlighted')
      // LaTeX's [HTML] color model round-trips through uppercase hex digits;
      // semantically identical to the lowercase input, just normalized.
      expect(colored?.kind === 'text' && colored.marks?.[0]).toEqual({ type: 'color', attrs: { color: '#2F6FED' } })
      expect(highlighted?.kind === 'text' && highlighted.marks?.[0]).toEqual({ type: 'highlight', attrs: { color: '#FFF2A8' } })
    }
  })

  it('preserves highlight color through the Tiptap JSON bridge (not just LaTeX)', () => {
    const json = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hi', marks: [{ type: 'highlight', attrs: { color: '#c9f2c9' } }] }],
        },
      ],
    }
    const base = createEmptyDocument()
    const model = tiptapJsonToModel(json, base)
    const node = model.content[0]
    expect(node.kind).toBe('paragraph')
    if (node.kind === 'paragraph' && node.content[0].kind === 'text') {
      expect(node.content[0].marks?.[0]).toEqual({ type: 'highlight', attrs: { color: '#c9f2c9' } })
    }
  })

  it('never crashes on unknown LaTeX and preserves it verbatim', () => {
    const source = '\\begin{document}\n\\begin{customenv}\nsome content\n\\end{customenv}\n\\end{document}'
    const { doc, diagnostics } = parseLatexDocument(source)
    expect(diagnostics.length).toBeGreaterThan(0)
    expect(doc.content[0].kind).toBe('unsupported')
    if (doc.content[0].kind === 'unsupported') {
      expect(doc.content[0].raw).toContain('customenv')
    }
  })
})
