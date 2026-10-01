// Stress test against a real, unedited academic LaTeX report template
// (BME 300 final report) — hand-written LaTeX with a large custom preamble,
// \section/\subsection/\begin{table} packed back-to-back with no blank
// lines, tabularx/longtable/booktabs, \multicolumn, and thebibliography.
// This is the kind of document the documented "supported subset" explicitly
// doesn't promise to fully understand, but it must never crash, and
// everything it CAN represent (headings, tables, lists, prose) should come
// through intact rather than being swallowed into one opaque blob.
import { describe, expect, it } from 'vitest'
import { parseLatexDocument } from '../latexParser'
import { documentToLatex } from '../documentToLatex'
import { bme300Latex } from './fixtures/bme300'

function cellText(cell: { content: { kind: string; content?: unknown[] }[] }): string {
  return cell.content
    .map((b) =>
      // @ts-expect-error -- narrowed loosely for a test helper
      b.kind === 'paragraph' ? b.content.map((n) => (n.kind === 'text' ? n.text : '')).join('') : '',
    )
    .join('')
}

describe('real-world document stress test (BME 300 report template)', () => {
  it('parses without crashing and produces a non-trivial structure', () => {
    const { doc } = parseLatexDocument(bme300Latex)
    expect(doc.content.length).toBeGreaterThan(100)
  })

  it('extracts every \\section/\\subsection as its own heading, not merged into one blob', () => {
    const { doc } = parseLatexDocument(bme300Latex)
    const headings = doc.content.filter((b) => b.kind === 'heading')
    expect(headings.length).toBeGreaterThanOrEqual(50)
    const titles = headings.map((h) => (h.kind === 'heading' ? h.content.map((n) => (n.kind === 'text' ? n.text : '')).join('') : ''))
    expect(titles).toContain('Introduction')
    expect(titles).toContain('Literature Review')
    expect(titles).toContain('Marking Summary')
  })

  it('parses every tabularx/longtable table with real row data (none empty)', () => {
    const { doc } = parseLatexDocument(bme300Latex)
    const tables = doc.content.filter((b) => b.kind === 'table')
    expect(tables.length).toBeGreaterThanOrEqual(15)
    for (const t of tables) {
      if (t.kind !== 'table') continue
      expect(t.rows.length).toBeGreaterThan(0)
    }
    const gapAnalysis = tables.find((t) => t.kind === 'table' && t.caption === 'Comparison of existing solutions')
    expect(gapAnalysis?.kind).toBe('table')
    if (gapAnalysis?.kind === 'table') {
      expect(cellText(gapAnalysis.rows[0].cells[0])).toBe('Source / Solution')
    }
  })

  it('parses the longtable deliverables list with its repeated-header markers resolved', () => {
    const { doc } = parseLatexDocument(bme300Latex)
    const links = doc.content.find((b) => b.kind === 'table' && b.caption === 'Supporting project deliverables')
    expect(links?.kind).toBe('table')
    if (links?.kind === 'table') {
      // 1 header row + 11 deliverable rows, not the \endfirsthead/\endhead
      // repeated-header text leaking in as extra fake rows.
      expect(links.rows).toHaveLength(12)
      expect(cellText(links.rows[1].cells[0])).toBe('IS-0 Project Proposal Approval')
    }
  })

  it('parses thebibliography as a reference list', () => {
    const { doc } = parseLatexDocument(bme300Latex)
    const bib = doc.content.find((b) => b.kind === 'orderedList')
    expect(bib?.kind).toBe('orderedList')
  })

  it('preserves \\begin{titlepage} content rather than crashing or deleting it', () => {
    const { doc, diagnostics } = parseLatexDocument(bme300Latex)
    const unsupported = doc.content.find((b) => b.kind === 'unsupported')
    expect(unsupported?.kind).toBe('unsupported')
    if (unsupported?.kind === 'unsupported') {
      expect(unsupported.raw).toContain('titlepage')
    }
    expect(diagnostics.some((d) => d.message.includes('titlepage'))).toBe(true)
  })

  it('round-trips its own generated LaTeX back through the parser without losing structure', () => {
    const first = parseLatexDocument(bme300Latex)
    const regenerated = documentToLatex(first.doc, { fullDocument: true })
    const second = parseLatexDocument(regenerated)
    // Stable under a second pass: our own output parses back to the same
    // shape rather than degrading further each round trip.
    expect(second.doc.content.length).toBe(first.doc.content.length)
    expect(second.diagnostics.length).toBe(first.diagnostics.length)
  })
})
