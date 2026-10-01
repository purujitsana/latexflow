import { useMemo } from 'react'
import katex from 'katex'
import type { BlockNode, DocumentModel, InlineNode } from '../types/document'

function renderInline(nodes: InlineNode[]): React.ReactNode {
  return nodes.map((n, i) => {
    if (n.kind === 'inlineMath') {
      try {
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: katex.renderToString(n.latex, { throwOnError: false }) }}
          />
        )
      } catch {
        return <span key={i}>${n.latex}$</span>
      }
    }
    let el: React.ReactNode = n.text
    for (const mark of n.marks ?? []) {
      switch (mark.type) {
        case 'bold':
          el = <strong>{el}</strong>
          break
        case 'italic':
          el = <em>{el}</em>
          break
        case 'underline':
          el = <u>{el}</u>
          break
        case 'strike':
          el = <s>{el}</s>
          break
        case 'code':
          el = <code>{el}</code>
          break
        case 'subscript':
          el = <sub>{el}</sub>
          break
        case 'superscript':
          el = <sup>{el}</sup>
          break
        case 'highlight':
          el = <mark style={{ background: mark.attrs?.color ?? '#fff2a8' }}>{el}</mark>
          break
        case 'link':
          el = (
            <a href={mark.attrs?.href} className="text-[var(--color-accent)] underline">
              {el}
            </a>
          )
          break
        case 'color':
          el = <span style={{ color: mark.attrs?.color }}>{el}</span>
          break
      }
    }
    return <span key={i}>{el}</span>
  })
}

function renderBlock(block: BlockNode, key: number): React.ReactNode {
  const alignClass =
    block.kind === 'paragraph' || block.kind === 'heading'
      ? { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify' }[block.align ?? 'left']
      : ''

  switch (block.kind) {
    case 'paragraph':
      return (
        <p key={key} className={`my-2 ${alignClass}`}>
          {renderInline(block.content)}
        </p>
      )
    case 'heading': {
      const Tag = (['h1', 'h2', 'h3', 'h4'] as const)[block.level - 1]
      return (
        <Tag key={key} className={`font-bold mt-4 mb-2 ${alignClass}`}>
          {renderInline(block.content)}
        </Tag>
      )
    }
    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 my-2">
          {block.items.map((item, i) => (
            <li key={i}>{item.content.map((b, bi) => renderBlock(b, bi))}</li>
          ))}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 my-2">
          {block.items.map((item, i) => (
            <li key={i}>{item.content.map((b, bi) => renderBlock(b, bi))}</li>
          ))}
        </ol>
      )
    case 'quote':
      return (
        <blockquote key={key} className="border-l-2 pl-4 my-2 opacity-80" style={{ borderColor: 'var(--color-border-strong)' }}>
          {block.content.map((b, i) => renderBlock(b, i))}
        </blockquote>
      )
    case 'codeBlock':
      return (
        <pre key={key} className="bg-[var(--color-bg-inset)] rounded p-3 my-2 overflow-x-auto text-sm">
          <code>{block.code}</code>
        </pre>
      )
    case 'equation': {
      try {
        return (
          <div
            key={key}
            className="my-3 text-center"
            dangerouslySetInnerHTML={{ __html: katex.renderToString(block.latex, { throwOnError: false, displayMode: true }) }}
          />
        )
      } catch {
        return <div key={key}>{block.latex}</div>
      }
    }
    case 'table':
      return (
        <table key={key} className="my-3 border-collapse w-full">
          <tbody>
            {block.rows.map((row, ri) => (
              <tr key={ri}>
                {row.cells.map((cell, ci) => {
                  const Cell = cell.header ? 'th' : 'td'
                  return (
                    <Cell key={ci} className="border px-2 py-1" style={{ borderColor: 'var(--color-border-strong)' }}>
                      {cell.content.map((b, bi) => renderBlock(b, bi))}
                    </Cell>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'image':
      return (
        <figure key={key} className="my-3 text-center">
          <img src={block.src} alt={block.alt ?? ''} className="max-w-full inline-block rounded" />
          {block.caption && <figcaption className="text-sm opacity-70 mt-1">{block.caption}</figcaption>}
        </figure>
      )
    case 'horizontalRule':
      return <hr key={key} className="my-4" style={{ borderColor: 'var(--color-border-strong)' }} />
    case 'pageBreak':
      return (
        <div key={key} className="my-6 text-center text-xs uppercase tracking-wide opacity-60 border-t border-dashed pt-2">
          Page Break
        </div>
      )
    case 'unsupported':
      return (
        <pre key={key} className="my-2 text-xs p-2 rounded border border-dashed" style={{ borderColor: 'var(--color-warn)' }}>
          {block.raw}
        </pre>
      )
    default:
      return null
  }
}

export function PreviewPanel({ doc }: { doc: DocumentModel }) {
  const blocks = useMemo(() => doc.content.map((b, i) => renderBlock(b, i)), [doc])
  return (
    <div className="h-full overflow-y-auto bg-[var(--color-bg)]">
      <div className="max-w-[780px] mx-auto px-14 py-10">
        {doc.metadata.title && <h1 className="text-3xl font-bold mb-1">{doc.metadata.title}</h1>}
        {doc.metadata.author && <p className="text-sm opacity-60 mb-6">{doc.metadata.author}</p>}
        {blocks}
      </div>
    </div>
  )
}
