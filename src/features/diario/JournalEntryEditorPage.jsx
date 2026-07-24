import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import NotebookEditor from '../../components/NotebookEditor'
import VerseLinkPicker from '../../components/VerseLinkPicker'
import { useJournalEntries } from '../../hooks/useJournalEntries'
import { toLocalDateString } from '../../lib/date'
import { describeSupabaseError } from '../../lib/errors'

function JournalEntryForm({ mode, existingEntry }) {
  const navigate = useNavigate()
  const { save, remove, isSaving, isDeleting } = useJournalEntries()
  const [entryDate, setEntryDate] = useState(
    existingEntry?.entry_date ?? toLocalDateString(new Date())
  )
  const [content, setContent] = useState(existingEntry?.content ?? '')
  const [linkedVerseId, setLinkedVerseId] = useState(existingEntry?.linked_verse_id ?? null)
  const [formError, setFormError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    save(
      { id: existingEntry?.id, entryDate, content, linkedVerseId },
      {
        onSuccess: () => navigate('/diario'),
        onError: (err) => setFormError(describeSupabaseError(err)),
      }
    )
  }

  function handleDelete() {
    setFormError('')
    remove(existingEntry.id, {
      onSuccess: () => navigate('/diario'),
      onError: (err) => setFormError(describeSupabaseError(err)),
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => navigate('/diario')}
          className="self-start text-sm text-text-secondary hover:text-text-primary"
        >
          ← Volver
        </button>
        <h1 className="font-voice text-lg text-text-primary">
          {mode === 'edit' ? 'Editar entrada' : 'Nueva entrada'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1 max-w-xs">
          <label htmlFor="entryDate" className="text-sm text-text-secondary">
            Fecha
          </label>
          <input
            id="entryDate"
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
            className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-text-secondary">Vincular a un versículo</label>
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
              onClick={() => navigate('/diario')}
              className="text-sm text-text-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
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

export default function JournalEntryEditorPage() {
  const { id } = useParams()
  const { entries, isLoading, isError } = useJournalEntries()

  if (!id) {
    return <JournalEntryForm mode="create" />
  }

  if (isLoading) {
    return <p className="text-text-secondary">Cargando…</p>
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">
        No pudimos cargar tu diario. Intenta recargar la página.
      </p>
    )
  }

  const existingEntry = entries.find((entry) => entry.id === id)

  if (!existingEntry) {
    return <p className="text-text-secondary">No encontramos esa entrada.</p>
  }

  return <JournalEntryForm mode="edit" existingEntry={existingEntry} />
}
