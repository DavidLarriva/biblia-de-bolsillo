import { useMemo, useState } from 'react'
import { usePrayerRequests } from '../../hooks/usePrayerRequests'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { describeSupabaseError } from '../../lib/errors'

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

export default function OracionPage() {
  const { requests, isLoading, isError, create, isCreating, markAnswered, remove, actionError } =
    usePrayerRequests()
  const [content, setContent] = useState('')

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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-voice text-lg text-text-primary mb-3">Oración</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 bg-bg-elevated rounded-xl p-4"
        >
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            placeholder="Escribí tu petición…"
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

      {actionError && (
        <p className="text-sm text-red-400">{describeSupabaseError(actionError)}</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tus peticiones. Intentá recargar la página.
        </p>
      )}

      {isLoading && <SkeletonList count={2} />}

      {!isLoading && !isError && requests.length === 0 && (
        <EmptyState title="Empezá a llevar tus oraciones">
          Anotá aquello por lo que querés orar. Cuando una petición sea respondida vas a poder
          marcarla y guardarla como recuerdo.
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
            <div key={request.id} className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-3">
              <p className="text-text-primary">{request.content}</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => markAnswered(request.id)}
                  className="text-sm text-accent"
                >
                  Marcar como respondida
                </button>
                <button
                  type="button"
                  onClick={() => remove(request.id)}
                  className="text-sm text-red-400"
                >
                  Eliminar
                </button>
              </div>
            </div>
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
            <div key={request.id} className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-2">
              <p className="text-text-primary">{request.content}</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-muted">{formatAnsweredAfter(request)}</p>
                <button
                  type="button"
                  onClick={() => remove(request.id)}
                  className="text-xs text-red-400"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  )
}
