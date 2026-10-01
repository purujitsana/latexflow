import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import type { BlockLineRange } from '../conversion/documentToLatex'
import { setSyncHighlight } from '../editor/extensions/CursorSyncHighlight'

interface DocBlockRange {
  from: number
  to: number
}

function findIndexForLine(ranges: BlockLineRange[], line: number): number {
  for (let i = 0; i < ranges.length; i++) {
    if (line >= ranges[i].start && line <= ranges[i].end) return i
  }
  return -1
}

function findIndexForPos(ranges: DocBlockRange[], pos: number): number {
  for (let i = 0; i < ranges.length; i++) {
    if (pos >= ranges[i].from && pos < ranges[i].to) return i
  }
  return -1
}

// Tiptap's top-level doc children are generated 1:1, in order, from
// `document.model.content` (see modelToTiptapJson) — so child index `i`
// here always corresponds to `latexLineRanges[i]`, no separate mapping needed.
function getTopLevelBlockRanges(editor: Editor): DocBlockRange[] {
  const ranges: DocBlockRange[] = []
  editor.state.doc.forEach((node, offset) => {
    ranges.push({ from: offset, to: offset + node.nodeSize })
  })
  return ranges
}

/**
 * Cursor-position sync between the two editors: moving the cursor in one
 * highlights (and gently scrolls to) the corresponding block in the other.
 * Read-only — it never moves the other editor's actual cursor/selection, so
 * it can't interfere with the content sync engine or fight the user's typing.
 */
export function useCursorSync(editor: Editor | null, latexLineRanges: BlockLineRange[]) {
  const [latexHighlight, setLatexHighlight] = useState<BlockLineRange | null>(null)
  const rangesRef = useRef(latexLineRanges)
  rangesRef.current = latexLineRanges

  // LaTeX cursor moved -> highlight + scroll to the matching document block.
  const handleLatexCursorLine = (line: number) => {
    if (!editor) return
    const index = findIndexForLine(rangesRef.current, line)
    if (index < 0) {
      setSyncHighlight(editor, null)
      return
    }
    const target = getTopLevelBlockRanges(editor)[index]
    if (!target) {
      setSyncHighlight(editor, null)
      return
    }
    setSyncHighlight(editor, target)
    const dom = editor.view.nodeDOM(target.from)
    if (dom instanceof HTMLElement) dom.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  // Document cursor moved -> highlight the matching LaTeX line range.
  useEffect(() => {
    if (!editor) return
    const onSelectionUpdate = () => {
      const pos = editor.state.selection.from
      const index = findIndexForPos(getTopLevelBlockRanges(editor), pos)
      setLatexHighlight(index >= 0 ? (rangesRef.current[index] ?? null) : null)
      // The user is now interacting with the document directly, so the
      // "you just jumped here from LaTeX" highlight is no longer relevant.
      setSyncHighlight(editor, null)
    }
    editor.on('selectionUpdate', onSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', onSelectionUpdate)
    }
  }, [editor])

  return { latexHighlight, handleLatexCursorLine }
}
