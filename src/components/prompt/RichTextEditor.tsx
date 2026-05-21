import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { Bold, Italic, Code, List, ListOrdered, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  ariaLabel: string
  minHeightClass?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  ariaLabel,
  minHeightClass = 'min-h-[200px]',
}: RichTextEditorProps) {
  const isProgrammaticUpdate = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Markdown,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    onUpdate({ editor }) {
      if (isProgrammaticUpdate.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange((editor.storage as any).markdown.getMarkdown())
    },
  })

  // Re-hydrate when the controlled value changes externally
  useEffect(() => {
    if (!editor) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (editor.storage as any).markdown.getMarkdown()
    if (current !== value) {
      isProgrammaticUpdate.current = true
      editor.commands.setContent(value, { emitUpdate: false })
      isProgrammaticUpdate.current = false
    }
  }, [value, editor])

  const handleLink = () => {
    if (!editor) return
    const url = window.prompt('URL:')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  return (
    <div
      className="border border-border rounded bg-background"
      aria-label={ariaLabel}
    >
      <div className="flex gap-1 p-1 border-b border-border flex-wrap">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Bold"
          aria-pressed={editor?.isActive('bold') ?? false}
          className={editor?.isActive('bold') ? 'bg-muted' : ''}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Italic"
          aria-pressed={editor?.isActive('italic') ?? false}
          className={editor?.isActive('italic') ? 'bg-muted' : ''}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Inline code"
          aria-pressed={editor?.isActive('code') ?? false}
          className={editor?.isActive('code') ? 'bg-muted' : ''}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Bullet list"
          aria-pressed={editor?.isActive('bulletList') ?? false}
          className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Ordered list"
          aria-pressed={editor?.isActive('orderedList') ?? false}
          className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Insert link"
          aria-pressed={editor?.isActive('link') ?? false}
          className={editor?.isActive('link') ? 'bg-muted' : ''}
          onClick={handleLink}
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className={`p-3 ${minHeightClass} text-sm leading-6 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit] [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_a]:underline [&_a]:text-primary [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:h-0`}
      />
    </div>
  )
}
