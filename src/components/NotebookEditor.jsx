import { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import VerseSearchModal from './VerseSearchModal'
import { VersiculoExtension, textoADoc, docATexto } from '../lib/versiculoNode'
import { limpiarComillas } from '../lib/versiculos'

export default function NotebookEditor({ value, onChange }) {
  const [modalOpen, setModalOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      VersiculoExtension,
    ],
    content: textoADoc(value ?? ''),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'font-voice text-text-primary leading-relaxed min-h-[200px] focus:outline-none [&_p]:min-h-[1.5em]',
      },
    },
    onUpdate({ editor: editorInstance }) {
      onChange(docATexto(editorInstance.getJSON()))
    },
  })

  // Si `value` cambia desde afuera (ej. al cargar una entrada existente en
  // el formulario), se sincroniza el documento sin pisar lo que el usuario
  // está escribiendo — el mismo patrón que usaba el contentEditable anterior.
  useEffect(() => {
    if (!editor) return
    const actual = docATexto(editor.getJSON())
    if (actual !== (value ?? '')) {
      editor.commands.setContent(textoADoc(value ?? ''))
    }
  }, [value, editor])

  function handleInsert({ referencia, texto, version }) {
    setModalOpen(false)
    editor
      ?.chain()
      .focus()
      .insertContent([
        { type: 'versiculo', attrs: { referencia, texto: limpiarComillas(texto), version } },
        { type: 'text', text: ' ' },
      ])
      .run()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="absolute top-2 right-2 text-xs text-text-muted hover:text-accent z-10"
      >
        Insertar versículo
      </button>

      <div
        onClick={() => editor?.chain().focus().run()}
        className="pt-8 px-1 pb-2 border-b border-border-subtle focus-within:border-accent transition-colors cursor-text"
      >
        <EditorContent editor={editor} />
      </div>

      {modalOpen && <VerseSearchModal onInsert={handleInsert} onClose={() => setModalOpen(false)} />}
    </div>
  )
}
