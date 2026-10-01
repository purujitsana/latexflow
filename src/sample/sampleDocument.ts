import type { DocumentModel } from '../types/document'
import { DEFAULT_PREAMBLE } from '../types/document'

const now = new Date().toISOString()

export const sampleDocument: DocumentModel = {
  metadata: { title: 'Research Notes', author: '', createdAt: now, updatedAt: now },
  preamble: { ...DEFAULT_PREAMBLE, packages: [...DEFAULT_PREAMBLE.packages] },
  content: [
    { kind: 'heading', level: 1, content: [{ kind: 'text', text: 'Introduction' }] },
    {
      kind: 'paragraph',
      content: [{ kind: 'text', text: 'Biomedical engineering combines engineering and medicine.' }],
    },
    { kind: 'paragraph', content: [{ kind: 'text', text: 'Important equation:', marks: [{ type: 'bold' }] }] },
    { kind: 'equation', latex: 'F = ma' },
    {
      kind: 'paragraph',
      content: [{ kind: 'text', text: 'The following measurements are important:' }],
    },
    {
      kind: 'bulletList',
      items: [
        { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Heart rate' }] }] },
        { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'SpO2' }] }] },
        { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Respiratory rate' }] }] },
      ],
    },
    { kind: 'paragraph', content: [{ kind: 'text', text: 'A simple mathematical expression:' }] },
    { kind: 'equation', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { kind: 'paragraph', content: [{ kind: 'text', text: 'A table containing:' }] },
    {
      kind: 'table',
      rows: [
        {
          cells: [
            { header: true, content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Parameter' }] }] },
            { header: true, content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Value' }] }] },
            { header: true, content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Unit' }] }] },
          ],
        },
        {
          cells: [
            { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'Heart Rate' }] }] },
            { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: '72' }] }] },
            { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'bpm' }] }] },
          ],
        },
        {
          cells: [
            { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: 'SpO2' }] }] },
            { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: '98' }] }] },
            { content: [{ kind: 'paragraph', content: [{ kind: 'text', text: '%' }] }] },
          ],
        },
      ],
    },
  ],
}
