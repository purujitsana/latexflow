// Internal document model (IR) shared by the rich editor and the LaTeX
// generator/parser. Neither conversion direction talks to the other's
// concrete format directly — everything routes through this shape so the
// two editors can't drift into an unstable direct-conversion loop.

export type Alignment = 'left' | 'center' | 'right' | 'justify'

export type MarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'link'
  | 'subscript'
  | 'superscript'
  | 'color'
  | 'highlight'

export interface Mark {
  type: MarkType
  attrs?: Record<string, string | undefined>
}

export interface TextNode {
  kind: 'text'
  text: string
  marks?: Mark[]
}

export interface InlineMathNode {
  kind: 'inlineMath'
  latex: string
}

export type InlineNode = TextNode | InlineMathNode

export interface ParagraphNode {
  kind: 'paragraph'
  align?: Alignment
  content: InlineNode[]
}

export interface HeadingNode {
  kind: 'heading'
  level: 1 | 2 | 3 | 4
  align?: Alignment
  content: InlineNode[]
}

export interface ListItemNode {
  content: BlockNode[]
  checked?: boolean
}

export interface BulletListNode {
  kind: 'bulletList'
  items: ListItemNode[]
  task?: boolean
}

export interface OrderedListNode {
  kind: 'orderedList'
  items: ListItemNode[]
  start?: number
}

export interface QuoteNode {
  kind: 'quote'
  content: BlockNode[]
}

export interface CodeBlockNode {
  kind: 'codeBlock'
  language?: string
  code: string
}

export interface EquationNode {
  kind: 'equation'
  latex: string
  numbered?: boolean
  environment?: 'equation' | 'align' | 'gather'
  label?: string
}

export interface TableCellNode {
  content: BlockNode[]
  header?: boolean
}

export interface TableRowNode {
  cells: TableCellNode[]
}

export interface TableNode {
  kind: 'table'
  rows: TableRowNode[]
  caption?: string
}

export interface ImageNode {
  kind: 'image'
  src: string
  alt?: string
  caption?: string
  width?: number
}

export interface HorizontalRuleNode {
  kind: 'horizontalRule'
}

export interface PageBreakNode {
  kind: 'pageBreak'
}

export interface UnsupportedBlockNode {
  kind: 'unsupported'
  raw: string
  reason?: string
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | QuoteNode
  | CodeBlockNode
  | EquationNode
  | TableNode
  | ImageNode
  | HorizontalRuleNode
  | PageBreakNode
  | UnsupportedBlockNode

export interface DocumentMetadata {
  title: string
  author?: string
  date?: string
  createdAt: string
  updatedAt: string
}

export interface LatexPreamble {
  documentClass: string
  documentClassOptions?: string
  packages: string[]
  extra?: string
}

export interface DocumentModel {
  metadata: DocumentMetadata
  preamble: LatexPreamble
  content: BlockNode[]
}

export const DEFAULT_PREAMBLE: LatexPreamble = {
  documentClass: 'article',
  documentClassOptions: '11pt',
  packages: ['amsmath', 'amssymb', 'graphicx', 'hyperref'],
  extra: '',
}

export function createEmptyDocument(title = 'Untitled Document'): DocumentModel {
  const now = new Date().toISOString()
  return {
    metadata: { title, createdAt: now, updatedAt: now },
    preamble: { ...DEFAULT_PREAMBLE, packages: [...DEFAULT_PREAMBLE.packages] },
    content: [{ kind: 'paragraph', content: [] }],
  }
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export interface Diagnostic {
  line: number
  column?: number
  message: string
  severity: DiagnosticSeverity
}
