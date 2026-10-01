import { EditorContent, type Editor } from '@tiptap/react'

export function DocumentEditor({ editor }: { editor: Editor | null }) {
  return (
    <div className="doc-editor h-full overflow-y-auto bg-[var(--color-bg)]">
      <EditorContent editor={editor} />
    </div>
  )
}
