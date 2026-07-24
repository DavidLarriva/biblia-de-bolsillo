import { useEffect, useRef, useState } from 'react'
import VerseSearchModal from './VerseSearchModal'

const VERSION_LABELS = {
  rvr1960: 'RVR1960',
  ntv: 'NTV',
}

export default function NotebookEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const savedRangeRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const el = editorRef.current
    if (el && el.innerHTML !== (value ?? '')) {
      el.innerHTML = value ?? ''
    }
  }, [value])

  function handleInput() {
    onChange(editorRef.current.innerHTML)
  }

  function saveSelection() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange()
      }
    }
  }

  function openModal() {
    saveSelection()
    setModalOpen(true)
  }

  function handleInsert({ referencia, texto, version }) {
    setModalOpen(false)

    const editor = editorRef.current
    editor.focus()

    const selection = window.getSelection()
    let range = savedRangeRef.current

    if (!range || !editor.contains(range.commonAncestorContainer)) {
      range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
    }

    selection.removeAllRanges()
    selection.addRange(range)

    const versionLabel = VERSION_LABELS[version] ?? version

    const blockquote = document.createElement('blockquote')
    blockquote.className = 'verse-insert'

    const p = document.createElement('p')
    p.textContent = `"${texto}"`

    const cite = document.createElement('cite')
    cite.textContent = `${referencia} — ${versionLabel}`

    blockquote.appendChild(p)
    blockquote.appendChild(cite)

    range.deleteContents()
    range.insertNode(blockquote)

    // Un elemento de bloque no ofrece una posición de caret fiable justo
    // después de sí mismo: sin un nodo de texto real ahí, el navegador
    // ancla el cursor al último nodo de texto interior (el <cite>).
    const spacer = document.createTextNode('​')
    blockquote.after(spacer)

    const newRange = document.createRange()
    newRange.setStart(spacer, spacer.length)
    newRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(newRange)

    savedRangeRef.current = null
    onChange(editor.innerHTML)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openModal}
        className="absolute top-2 right-2 text-xs text-text-muted hover:text-accent z-10"
      >
        Insertar versículo
      </button>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`font-voice text-text-primary leading-relaxed min-h-[200px] pt-8 px-1 pb-2 bg-transparent border-b outline-none transition-colors ${
          focused ? 'border-accent' : 'border-border-subtle'
        }`}
      />

      {modalOpen && (
        <VerseSearchModal onInsert={handleInsert} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
