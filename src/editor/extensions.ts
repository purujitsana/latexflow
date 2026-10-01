import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import ImageExt from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import type { Extensions } from '@tiptap/core'

import { MathInline } from './extensions/MathInline'
import { MathBlock } from './extensions/MathBlock'
import { UnsupportedBlock } from './extensions/UnsupportedBlock'
import { PageBreak } from './extensions/PageBreak'
import { CursorSyncHighlight } from './extensions/CursorSyncHighlight'

export function buildExtensions(): Extensions {
  return [
    StarterKit.configure({
      link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      underline: {},
      heading: { levels: [1, 2, 3, 4] },
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['paragraph', 'heading'] }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    ImageExt.configure({ inline: false }),
    Placeholder.configure({ placeholder: 'Start writing your document…' }),
    CharacterCount,
    MathInline,
    MathBlock,
    UnsupportedBlock,
    PageBreak,
    CursorSyncHighlight,
  ]
}
