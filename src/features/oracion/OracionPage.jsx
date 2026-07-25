import { useMemo, useState } from 'react'
import { usePrayerRequests } from '../../hooks/usePrayerRequests'
import AnswerPrayerModal from '../../components/AnswerPrayerModal'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { describeSupabaseError } from '../../lib/errors'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function daysBetween(startIso, endIso) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

function formatAnsweredAfter(request) {
  const days = daysBetween(request.created_at, request.answered_at)
  if (days <= 0) return 'Respondida el mismo día'
  return `Respondida después de ${days} ${days === 1 ? 'día' : 'días'}`
}

function PrayerCard({ request, onUpdateContent, onDelete, onMarkAnswered, isUpdatingContent }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(request.content)

  function startEdit() {
    setDraft(request.content)
    setIsEditing(true)
  }

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onUpdateContent(trimmed, { onSuccess: () => setIsEditing(false) })
  }

  return (
    <div className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-text-muted">{formatDate(request.created_at)}</p>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
        />
      ) : (
        <p className="text-text-primary">{request.content}</p>
      )}

      {request.status === 'respondida' && (
        <>
          <p className="text-xs text-text-muted">{formatAnsweredAfter(request)}</p>
          {request.answer_note && (
            <p className="font-voice italic text-text-primary border-l-2 border-accent pl-3">
              {request.answer_note}
            </p>
          )}
        </>
      )}

      <div className="flex items-center gap-4">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdatingContent || !draft.trim()}
              className="text-sm text-accent disabled:opacity-50"
            >
              {isUpdatingContent ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm text-text-secondary"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            {request.status === 'pendiente' && (
              <button type="button" onClick={onMarkAnswered} className="text-sm text-accent">
                Marcar como respondida
              </button>
            )}
            <button
              type="button"
              onClick={startEdit}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Editar
            </button>
            <button type="button" onClick={onDelete} className="text-sm text-red-400">
              Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function OracionPage() {
  const {
    requests,
    isLoading,
    isError,
    create,
    isCreating,
    updateContent,
    isUpdatingContent,
    markAnswered,
    isMarkingAnswered,
    remove,
    actionError,
  } = usePrayerRequests()
  const [content, setContent] = useState('')
  const [answeringId, setAnsweringId] = useState(null)

  const pendientes = useMemo(() => requests.filter((r) => r.status === 'pendiente'), [requests])

  const respondidas = useMemo(() => {
    return requests
      .filter((r) => r.status === 'respondida')
      .sort((a, b) => new Date(b.answered_at) - new Date(a.answered_at))
  }, [requests])

  function handleSubmit(event) {
    event.preventDefault()
    if (!content.trim()) return
    create(content.trim(), { onSuccess: () => setContent('') })
  }

  function handleConfirmAnswer(answerNote) {
    markAnswered({ id: answeringId, answerNote }, { onSuccess: () => setAnsweringId(null) })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-voice text-lg text-text-primary mb-3">Oración</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-bg-elevated rounded-xl p-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="Escribe tu petición…"
            className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={isCreating || !content.trim()}
            className="self-end bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium disabled:opacity-60"
          >
            {isCreating ? 'Guardando…' : 'Agregar petición'}
          </button>
        </form>
      </div>

      {actionError && <p className="text-sm text-red-400">{describeSupabaseError(actionError)}</p>}

      {isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tus peticiones. Intenta recargar la página.
        </p>
      )}

      {isLoading && <SkeletonList count={2} />}

      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState title="Empieza a llevar tus oraciones">
          Anota aquello por lo que quieres orar. Cuando una petición sea respondida vas a poder
          marcarla y guardar cómo Dios la respondió.
        </EmptyState>
      )}

      {!isLoading && requests.length > 0 && (
        <>
          <section>
            <h2 className="text-sm text-text-secondary mb-3">Pendientes</h2>
            {pendientes.length === 0 && (
              <p className="text-sm text-text-secondary">
                Ninguna petición pendiente por ahora. Que descanses en su paz.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {pendientes.map((request) => (
                <PrayerCard
                  key={request.id}
                  request={request}
                  onUpdateContent={(newContent, opts) =>
                    updateContent({ id: request.id, content: newContent }, opts)
                  }
                  onDelete={() => remove(request.id)}
                  onMarkAnswered={() => setAnsweringId(request.id)}
                  isUpdatingContent={isUpdatingContent}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm text-text-secondary mb-3">Respondidas</h2>
            {respondidas.length === 0 && (
              <p className="text-sm text-text-secondary">
                Cuando una oración sea respondida, quedará acá como testimonio.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {respondidas.map((request) => (
                <PrayerCard
                  key={request.id}
                  request={request}
                  onUpdateContent={(newContent, opts) =>
                    updateContent({ id: request.id, content: newContent }, opts)
                  }
                  onDelete={() => remove(request.id)}
                  isUpdatingContent={isUpdatingContent}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {answeringId && (
        <AnswerPrayerModal
          onConfirm={handleConfirmAnswer}
          onClose={() => setAnsweringId(null)}
          isSaving={isMarkingAnswered}
        />
      )}
    </div>
  )
}
