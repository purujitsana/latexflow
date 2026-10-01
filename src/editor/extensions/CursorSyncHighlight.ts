import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Editor } from '@tiptap/react'

export interface SyncHighlightRange {
  from: number
  to: number
}

export const syncHighlightKey = new PluginKey<DecorationSet>('lf-sync-highlight')

/**
 * Renders the cursor-sync highlight as a real ProseMirror decoration rather
 * than a one-off DOM class mutation. This matters because ProseMirror can
 * redraw a node's DOM for reasons entirely unrelated to our own content sync
 * (e.g. gapcursor/dropcursor redrawing on focus changes when the user clicks
 * into the LaTeX pane) — a decoration is recomputed from plugin state on
 * every such redraw, so it can't be silently wiped by one, unlike a class
 * added directly to a DOM node we don't control the lifecycle of.
 */
export const CursorSyncHighlight = Extension.create({
  name: 'cursorSyncHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: syncHighlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(syncHighlightKey) as SyncHighlightRange | null | undefined
            if (meta === undefined) return old.map(tr.mapping, tr.doc)
            if (!meta) return DecorationSet.empty
            return DecorationSet.create(tr.doc, [Decoration.node(meta.from, meta.to, { class: 'lf-sync-block' })])
          },
        },
        props: {
          decorations(state) {
            return syncHighlightKey.getState(state)
          },
        },
      }),
    ]
  },
})

export function setSyncHighlight(editor: Editor, range: SyncHighlightRange | null) {
  const tr = editor.state.tr.setMeta(syncHighlightKey, range).setMeta('addToHistory', false)
  editor.view.dispatch(tr)
}
