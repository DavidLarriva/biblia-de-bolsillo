import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NotebookEditor from '../../components/NotebookEditor'
import VerseLinkPicker from '../../components/VerseLinkPicker'
import { useStudyNotes } from '../../hooks/useStudyNotes'
import { toLocalDateString } from '../../lib/date'
import { describeSupabaseError } from '../../lib/errors'

function StudyNoteForm({ mode, existingNote }) {
  const navigate = useNavigate()
  const { save, remove, isSaving, isDeleting } = useStudyNotes()
  const [noteDate, setNoteDate] = useState(
    existingNote?.note_date ?? toLocalDateString(new Date())
  )
  const [title, setTitle] = useState(existingNote?.title ?? '')
  const [linkedVerseId, setLinkedVerseId] = useState(existingNote?.linked_verse_id ?? null)
  const [content, setContent] = useState(existingNote?.content ?? '')
  const [formError, setFormError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    save(
      {
        id: existingNote?.id,
        noteDate,
        title: title.trim(),
        linkedVerseId,
        content,
      },
      {
        onSuccess: () => navigate('/notas'),
        onError: (err) => setFormError(describeSupabaseError(err)),
      }
    )
  }

  function handleDelete() {
    setFormError('')
    remove(existingNote.id, {
      onSuccess: () => navigate('/notas'),
      onError: (err) => setFormError(describeSupabaseError(err)),
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => navigate('/notas')}
          className="self-start text-sm text-text-secondary hover:text-text-primary"
        >
          ← Volver
        </button>
        <h1 className="font-voice text-lg text-text-primary">
          {mode === 'edit' ? 'Editar nota' : 'Nueva nota'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1 max-w-xs">
          <label htmlFor="noteDate" className="text-sm text-text-secondary">
            Fecha
          </label>
          <input
            id="noteDate"
            type="date"
            value={noteDate}
            onChange={(event) => setNoteDate(event.target.value)}
            className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-text-secondary">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-text-secondary">
            Vincular a un versículo <span className="text-text-muted">(opcional)</span>
          </label>
          <VerseLinkPicker value={linkedVerseId} onSelect={setLinkedVerseId} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-text-secondary">Contenido</label>
          <NotebookEditor value={content} onChange={setContent} />
        </div>

        {formError && <p className="text-sm text-red-400">{formError}</p>}

        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
          {mode === 'edit' ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-400 disabled:opacity-50"
            >
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/notas')}
              className="text-sm text-text-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="bg-accent text-accent-text rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function StudyNoteEditorPage() {
  const { id } = useParams()
  const { notes, isLoading, isError } = useStudyNotes()

  if (!id) {
    return <StudyNoteForm mode="create" />
  }

  if (isLoading) {
    return <p className="text-text-secondary">Cargando…</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        No pudimos cargar tus notas. Intenta recargar la página.
      </p>
    )
  }

  const existingNote = notes.find((note) => note.id === id)

  if (!existingNote) {
    return <p className="text-text-secondary">No encontramos esa nota.</p>
  }

  return <StudyNoteForm mode="edit" existingNote={existingNote} />
}
