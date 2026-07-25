import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStudyNotes } from '../../hooks/useStudyNotes'
import StudyNoteDetailModal from '../../components/StudyNoteDetailModal'
import VerseFormModal from '../../components/VerseFormModal'
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
  const [verseToEdit, setVerseToEdit] = useState(null)
  const [tagFilter, setTagFilter] = useState('')

  const allTags = useMemo(() => {
    const all = notes.flatMap((n) => n.tags ?? [])
    return [...new Set(all)].sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    if (!tagFilter) return notes
    return notes.filter((note) => (note.tags ?? []).includes(tagFilter))
  }, [notes, tagFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-voice text-lg text-text-primary">Notas</h1>
        <div className="flex items-center gap-3">
          {allTags.length > 0 && (
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded px-2 py-1 text-text-secondary text-sm"
            >
              <option value="">Todas las etiquetas</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
          <Link
            to="/notas/nueva"
            className="bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium shrink-0"
          >
            + nueva nota
          </Link>
        </div>
      </div>

      {isLoading && <SkeletonList count={3} />}

      {isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tus notas. Intenta recargar la página.
        </p>
      )}

      {deleteError && (
        <p className="text-sm text-red-400">{describeSupabaseError(deleteError)}</p>
      )}

      {!isLoading && !isError && notes.length === 0 && (
        <EmptyState title="Todavía no hay notas">
          Guarda lo que aprendas de cada prédica o estudio. Puedes vincularla a un versículo
          guardado e insertar otros dentro de la nota.
        </EmptyState>
      )}

      {!isLoading && !isError && notes.length > 0 && filteredNotes.length === 0 && (
        <p className="text-sm text-text-secondary">Ninguna nota coincide con este filtro.</p>
      )}

      <div className="flex flex-col gap-3">
        {filteredNotes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => setDetailNote(note)}
            className="text-left bg-bg-elevated rounded-xl p-5"
          >
            <p className="text-sm text-text-muted mb-1">{formatLongDate(note.note_date)}</p>
            <p className="font-voice text-text-primary mb-1">{note.title}</p>
            {note.saved_verses && (
              <span className="inline-block mb-2 text-xs rounded-full bg-accent/10 text-accent px-2 py-1">
                {note.saved_verses.reference}
              </span>
            )}
            <p className="text-sm text-text-secondary">{excerpt(note.content)}</p>
            {note.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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
          onOpenVerse={(verse) => {
            setDetailNote(null)
            setVerseToEdit(verse)
          }}
        />
      )}

      {verseToEdit && (
        <VerseFormModal
          mode="edit"
          existingVerse={verseToEdit}
          onClose={() => setVerseToEdit(null)}
        />
      )}
    </div>
  )
}
