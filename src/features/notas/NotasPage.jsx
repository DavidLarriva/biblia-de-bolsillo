import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudyNotes } from '../../hooks/useStudyNotes'
import StudyNoteDetailModal from '../../components/StudyNoteDetailModal'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { stripHtml } from '../../lib/stripHtml'
import { formatLongDate } from '../../lib/date'
import { describeSupabaseError } from '../../lib/errors'

function excerpt(html, length = 160) {
  const text = stripHtml(html)
  return text.length > length ? `${text.slice(0, length)}…` : text
}

export default function NotasPage() {
  const { notes, isLoading, isError, remove, deleteError } = useStudyNotes()
  const [detailNote, setDetailNote] = useState(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-voice text-lg text-text-primary">Notas</h1>
        <Link
          to="/notas/nueva"
          className="bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium shrink-0"
        >
          + nueva nota
        </Link>
      </div>

      {isLoading && <SkeletonList count={3} />}

      {isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tus notas. Intentá recargar la página.
        </p>
      )}

      {deleteError && (
        <p className="text-sm text-red-400">{describeSupabaseError(deleteError)}</p>
      )}

      {!isLoading && !isError && notes.length === 0 && (
        <EmptyState title="Todavía no hay notas">
          Guardá lo que aprendas de cada prédica o estudio. Podés añadir el pasaje relacionado e
          insertar versículos dentro de la nota.
        </EmptyState>
      )}

      <div className="flex flex-col gap-3">
        {notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setDetailNote(note)}
            className="text-left bg-bg-elevated rounded-xl p-5"
          >
            <p className="text-sm text-text-muted mb-1">{formatLongDate(note.note_date)}</p>
            <p className="font-voice text-text-primary mb-1">{note.title}</p>
            <p className="text-sm text-text-secondary">{excerpt(note.content)}</p>
          </button>
        ))}
      </div>

      {detailNote && (
        <StudyNoteDetailModal
          note={detailNote}
          onClose={() => setDetailNote(null)}
          onDelete={() => {
            remove(detailNote.id)
            setDetailNote(null)
          }}
        />
      )}
    </div>
  )
}
