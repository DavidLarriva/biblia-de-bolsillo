import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useJournalEntries } from '../../hooks/useJournalEntries'
import VerseFormModal from '../../components/VerseFormModal'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { formatLongDate } from '../../lib/date'
import { describeSupabaseError } from '../../lib/errors'

export default function DiarioPage() {
  const { entries, isLoading, isError, remove, deleteError } = useJournalEntries()
  const [verseToEdit, setVerseToEdit] = useState(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-voice text-lg text-text-primary">Diario</h1>
        <Link
          to="/diario/nueva"
          className="bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium shrink-0"
        >
          + nueva entrada
        </Link>
      </div>

      {isLoading && <SkeletonList count={3} />}

      {isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tu diario. Intentá recargar la página.
        </p>
      )}

      {deleteError && (
        <p className="text-sm text-red-400">{describeSupabaseError(deleteError)}</p>
      )}

      {!isLoading && !isError && entries.length === 0 && (
        <EmptyState title="Tu diario está esperando">
          Escribí tu primera entrada cuando quieras: una oración, un aprendizaje o lo que Dios puso
          en tu corazón hoy.
        </EmptyState>
      )}

      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-bg-elevated rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm text-text-muted">{formatLongDate(entry.entry_date)}</p>
              <div className="flex items-center gap-3">
                <Link
                  to={`/diario/${entry.id}`}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="text-xs text-red-400"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {entry.saved_verses && (
              <button
                type="button"
                onClick={() => setVerseToEdit(entry.saved_verses)}
                className="inline-block mb-2 text-xs rounded-full bg-accent/10 text-accent px-2 py-1"
              >
                {entry.saved_verses.reference}
              </button>
            )}

            <div
              className="font-voice text-text-primary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </div>
        ))}
      </div>

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
