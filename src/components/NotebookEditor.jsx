import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import VerseSearchModal from './VerseSearchModal'
import { VersiculoExtension, textoADoc, docATexto } from '../lib/versiculoNode'
import { limpiarComillas } from '../lib/versiculos'

export default function NotebookEditor({
  value,
  onChange,
  editorClassName = 'font-voice text-text-primary leading-relaxed',
  minHeightClass = 'min-h-[200px]',
}) {
  const [modalOpen, setModalOpen] = useState(false)
  // Recuerda el último texto que el propio editor emitió, para no tener que
  // volver a serializar todo el documento (docATexto) en cada tecla solo
  // para compararlo contra `value` — ver efecto de sincronización abajo.
  const ultimoValorEmitido = useRef(value ?? '')

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
        class: `${editorClassName} ${minHeightClass} focus:outline-none [&_p]:min-h-[1.5em]`,
      },
    },
    onUpdate({ editor: editorInstance }) {
      const texto = docATexto(editorInstance.getJSON())
      ultimoValorEmitido.current = texto
      onChange(texto)
    },
  })

  // Si `value` cambia desde afuera (ej. al cargar una entrada existente en
  // el formulario), se sincroniza el documento sin pisar lo que el usuario
  // está escribiendo. Comparamos contra el último valor que el editor mismo
  // emitió (no contra una nueva serialización del documento actual): así
  // este efecto no hace trabajo en cada tecla, solo cuando `value` cambió
  // por una razón ajena al propio editor.
  useEffect(() => {
    if (!editor) return
    if (ultimoValorEmitido.current === (value ?? '')) return
    ultimoValorEmitido.current = value ?? ''
    editor.commands.setContent(textoADoc(value ?? ''))
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
