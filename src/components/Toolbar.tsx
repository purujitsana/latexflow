import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Code,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sigma,
  Table as TableIcon,
  Image as ImageIcon,
  Minus,
  FileText,
  Highlighter,
  Palette,
  Eraser,
  Undo2,
  Redo2,
} from 'lucide-react'
import { IconButton } from './ui/Button'

const HEADING_OPTIONS = [
  { label: 'Paragraph', value: '0' },
  { label: 'Heading 1', value: '1' },
  { label: 'Heading 2', value: '2' },
  { label: 'Heading 3', value: '3' },
  { label: 'Heading 4', value: '4' },
]

const TEXT_COLORS = ['#1c2129', '#d9432f', '#b9770e', '#1f9254', '#2f6fed', '#8a3ffc']
const HIGHLIGHT_COLORS = ['#fff2a8', '#c9f2c9', '#c9e2ff', '#ffd7c9', '#e6cfff']

function Divider() {
  return <div className="w-px self-stretch bg-[var(--color-border)] mx-1" />
}

function SwatchPicker({
  icon,
  colors,
  onPick,
  label,
}: {
  icon: React.ReactNode
  colors: string[]
  onPick: (color: string) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <IconButton aria-label={label} onClick={() => setOpen((o) => !o)}>
        {icon}
      </IconButton>
      {open && (
        <div
          className="absolute top-9 left-0 z-30 flex gap-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg lf-animate-in"
          onMouseLeave={() => setOpen(false)}
        >
          {colors.map((c) => (
            <button
              key={c}
              className="w-5 h-5 rounded-full border border-black/10"
              style={{ background: c }}
              onClick={() => {
                onPick(c)
                setOpen(false)
              }}
              aria-label={c}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return <div className="h-11 border-b border-[var(--color-border)]" />

  const headingValue = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
      ? '2'
      : editor.isActive('heading', { level: 3 })
        ? '3'
        : editor.isActive('heading', { level: 4 })
          ? '4'
          : '0'

  const insertLink = () => {
    const url = window.prompt('Link URL')
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = () => {
    const url = window.prompt('Image URL')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertInlineMath = () => {
    editor.chain().focus().insertContent({ type: 'mathInline', attrs: { latex: 'x^2' } }).run()
  }

  const insertBlockMath = () => {
    editor
      .chain()
      .focus()
      .insertContent({ type: 'mathBlock', attrs: { latex: 'F = ma', numbered: false } })
      .run()
  }

  return (
    <div
      className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] overflow-x-auto"
      role="toolbar"
      aria-label="Formatting"
    >
      <IconButton aria-label="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo2 size={16} />
      </IconButton>
      <IconButton aria-label="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo2 size={16} />
      </IconButton>

      <Divider />

      <select
        aria-label="Paragraph style"
        className="h-8 rounded-md bg-[var(--color-bg-inset)] text-sm px-2 border-none outline-none"
        value={headingValue}
        onChange={(e) => {
          const v = e.target.value
          if (v === '0') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: Number(v) as 1 | 2 | 3 | 4 }).run()
        }}
      >
        {HEADING_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <Divider />

      <IconButton aria-label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold size={16} />
      </IconButton>
      <IconButton aria-label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic size={16} />
      </IconButton>
      <IconButton
        aria-label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={16} />
      </IconButton>
      <IconButton
        aria-label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={16} />
      </IconButton>
      <IconButton aria-label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code size={16} />
      </IconButton>
      <IconButton
        aria-label="Subscript"
        active={editor.isActive('subscript')}
        onClick={() => editor.chain().focus().toggleSubscript().run()}
      >
        <SubscriptIcon size={16} />
      </IconButton>
      <IconButton
        aria-label="Superscript"
        active={editor.isActive('superscript')}
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
      >
        <SuperscriptIcon size={16} />
      </IconButton>

      <SwatchPicker
        icon={<Palette size={16} />}
        colors={TEXT_COLORS}
        label="Text color"
        onPick={(c) => editor.chain().focus().setColor(c).run()}
      />
      <SwatchPicker
        icon={<Highlighter size={16} />}
        colors={HIGHLIGHT_COLORS}
        label="Highlight"
        onPick={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()}
      />

      <IconButton aria-label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        <Eraser size={16} />
      </IconButton>

      <Divider />

      <IconButton aria-label="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
        <AlignLeft size={16} />
      </IconButton>
      <IconButton
        aria-label="Align center"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter size={16} />
      </IconButton>
      <IconButton
        aria-label="Align right"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight size={16} />
      </IconButton>
      <IconButton
        aria-label="Justify"
        active={editor.isActive({ textAlign: 'justify' })}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
      >
        <AlignJustify size={16} />
      </IconButton>

      <Divider />

      <IconButton aria-label="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List size={16} />
      </IconButton>
      <IconButton
        aria-label="Ordered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={16} />
      </IconButton>
      <IconButton aria-label="Checklist" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <ListChecks size={16} />
      </IconButton>
      <IconButton aria-label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote size={16} />
      </IconButton>

      <Divider />

      <IconButton aria-label="Insert link" active={editor.isActive('link')} onClick={insertLink}>
        <LinkIcon size={16} />
      </IconButton>
      <IconButton aria-label="Insert inline equation" onClick={insertInlineMath}>
        <Sigma size={16} />
      </IconButton>
      <IconButton aria-label="Insert equation block" onClick={insertBlockMath}>
        <FileText size={16} />
      </IconButton>
      <IconButton aria-label="Insert table" onClick={insertTable}>
        <TableIcon size={16} />
      </IconButton>
      <IconButton aria-label="Insert image" onClick={insertImage}>
        <ImageIcon size={16} />
      </IconButton>
      <IconButton aria-label="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus size={16} />
      </IconButton>
      <IconButton
        aria-label="Page break"
        onClick={() => editor.chain().focus().insertContent({ type: 'pageBreak' }).run()}
      >
        <span className="text-[10px] font-bold">PB</span>
      </IconButton>
      <IconButton
        aria-label="Code block"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <span className="text-[11px] font-mono">{'</>'}</span>
      </IconButton>
    </div>
  )
}
