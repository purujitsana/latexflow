import { describe, expect, it } from 'vitest'
import { documentToLatex } from '../documentToLatex'
import { parseLatexDocument } from '../latexParser'
import { tiptapJsonToModel } from '../tiptapBridge'
import { createEmptyDocument, type DocumentModel } from '../../types/document'

function docLatexDoc(doc: DocumentModel): DocumentModel {
  const latex = documentToLatex(doc, { fullDocument: true })
  return parseLatexDocument(latex).doc
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
      expect(back.content[0].rows[1].cells[0].content[0]).toMatchObject({ kind: 'paragraph' })
    }
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
