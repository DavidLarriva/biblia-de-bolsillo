import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStudyNotes } from '../../hooks/useStudyNotes'
import TextoConVersiculos from '../../components/TextoConVersiculos'
import VerseFormModal from '../../components/VerseFormModal'
import ShareButton from '../../components/ShareButton'
import { formatLongDate } from '../../lib/date'
import { formatearParaCompartir } from '../../lib/versiculos'
import { describeSupabaseError } from '../../lib/errors'

export default function StudyNoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notes, isLoading, isError, remove, deleteError } = useStudyNotes()
  const [verseToEdit, setVerseToEdit] = useState(null)

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

  const note = notes.find((n) => n.id === id)

  if (!note) {
    return <p className="text-text-secondary">No encontramos esa nota.</p>
  }

  function handleDelete() {
    remove(note.id, { onSuccess: () => navigate('/notas') })
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <button
        type="button"
        onClick={() => navigate('/notas')}
        className="self-start text-sm text-text-secondary hover:text-text-primary"
      >
        ← Volver
      </button>

      <div className="flex flex-col gap-1">
        <p className="text-sm text-text-muted">{formatLongDate(note.note_date)}</p>
        <h1 className="font-voice text-xl text-text-primary">{note.title}</h1>
      </div>

      {note.saved_verses && (
        <button
          type="button"
          onClick={() => setVerseToEdit(note.saved_verses)}
          className="self-start text-xs rounded-full bg-accent/10 text-accent px-2 py-1"
        >
          {note.saved_verses.reference}
        </button>
      )}

      <TextoConVersiculos
        texto={note.content}
        className="font-voice text-text-primary leading-relaxed"
      />

      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs rounded-full bg-bg-elevated-2 text-text-secondary px-2 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {deleteError && <p className="text-sm text-red-400">{describeSupabaseError(deleteError)}</p>}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border-subtle">
        <button type="button" onClick={handleDelete} className="text-sm text-red-400">
          Eliminar
        </button>
        <div className="flex items-center gap-4">
          <ShareButton
            title={note.title}
            text={`${note.title}\n\n${formatearParaCompartir(note.content)}`}
          />
          <Link to={`/notas/${note.id}/editar`} className="text-sm text-accent">
            Editar
          </Link>
        </div>
      </div>

      {verseToEdit && (
        <VerseFormModal mode="edit" existingVerse={verseToEdit} onClose={() => setVerseToEdit(null)} />
      )}
    </div>
  )
}
