import { useMemo, useState } from 'react'
import { usePrayerRequests } from '../../hooks/usePrayerRequests'
import AnswerPrayerModal from '../../components/AnswerPrayerModal'
import VerseSearchModal from '../../components/VerseSearchModal'
import TagInput from '../../components/TagInput'
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

function insertVerseIntoText(current, { referencia, texto }) {
  const quote = `"${texto}" (${referencia})`
  return current.trim() ? `${current}\n\n${quote}` : quote
}

function PrayerCard({ request, allTags, onUpdate, onDelete, onMarkAnswered, isUpdating }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(request.content)
  const [draftTags, setDraftTags] = useState(request.tags ?? [])
  const [verseModalOpen, setVerseModalOpen] = useState(false)

  function startEdit() {
    setDraft(request.content)
    setDraftTags(request.tags ?? [])
    setIsEditing(true)
  }

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) return
    onUpdate({ content: trimmed, tags: draftTags }, { onSuccess: () => setIsEditing(false) })
  }

  function handleInsertVerse({ referencia, texto }) {
    setDraft((prev) => insertVerseIntoText(prev, { referencia, texto }))
    setVerseModalOpen(false)
  }

  return (
    <div className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs text-text-muted">{formatDate(request.created_at)}</p>

      {isEditing ? (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setVerseModalOpen(true)}
              className="absolute top-2 right-2 text-xs text-text-muted hover:text-accent z-10"
            >
              Insertar versículo
            </button>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              className="w-full pt-8 bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <TagInput tags={draftTags} onChange={setDraftTags} suggestions={allTags} />
        </div>
      ) : (
        <>
          <p className="text-text-primary whitespace-pre-line">{request.content}</p>
          {request.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {request.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs rounded-full bg-bg-elevated-2 text-text-secondary px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {request.status === 'respondida' && (
        <>
          <p className="text-xs text-text-muted">{formatAnsweredAfter(request)}</p>
          {request.answer_note && (
            <p className="text-text-primary whitespace-pre-line">
              <span className="text-text-secondary">Respuesta: </span>
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
              disabled={isUpdating || !draft.trim()}
              className="text-sm text-accent disabled:opacity-50"
            >
              {isUpdating ? 'Guardando…' : 'Guardar'}
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

      {verseModalOpen && (
        <VerseSearchModal onInsert={handleInsertVerse} onClose={() => setVerseModalOpen(false)} />
      )}
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
  const [tags, setTags] = useState([])
  const [verseModalOpen, setVerseModalOpen] = useState(false)
  const [answeringId, setAnsweringId] = useState(null)
  const [tagFilter, setTagFilter] = useState('')

  const allTags = useMemo(() => {
    const all = requests.flatMap((r) => r.tags ?? [])
    return [...new Set(all)].sort()
  }, [requests])

  const pendientes = useMemo(() => {
    return requests.filter((r) => {
      if (r.status !== 'pendiente') return false
      if (tagFilter && !(r.tags ?? []).includes(tagFilter)) return false
      return true
    })
  }, [requests, tagFilter])

  const respondidas = useMemo(() => {
    return requests
      .filter((r) => {
        if (r.status !== 'respondida') return false
        if (tagFilter && !(r.tags ?? []).includes(tagFilter)) return false
        return true
      })
      .sort((a, b) => new Date(b.answered_at) - new Date(a.answered_at))
  }, [requests, tagFilter])

  function handleSubmit(event) {
    event.preventDefault()
    if (!content.trim()) return
    create(
      { content: content.trim(), tags },
      {
        onSuccess: () => {
          setContent('')
          setTags([])
        },
      }
    )
  }

  function handleInsertVerse({ referencia, texto }) {
    setContent((prev) => insertVerseIntoText(prev, { referencia, texto }))
    setVerseModalOpen(false)
  }

  function handleConfirmAnswer(answerNote) {
    markAnswered({ id: answeringId, answerNote }, { onSuccess: () => setAnsweringId(null) })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-voice text-lg text-text-primary mb-3">Oración</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-bg-elevated rounded-xl p-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setVerseModalOpen(true)}
              className="absolute top-2 right-2 text-xs text-text-muted hover:text-accent z-10"
            >
              Insertar versículo
            </button>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              placeholder="Escribe tu petición…"
              className="w-full pt-8 bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
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
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
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
            </div>
          )}

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
                  allTags={allTags}
                  onUpdate={(payload, opts) => updateContent({ id: request.id, ...payload }, opts)}
                  onDelete={() => remove(request.id)}
                  onMarkAnswered={() => setAnsweringId(request.id)}
                  isUpdating={isUpdatingContent}
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
                  allTags={allTags}
                  onUpdate={(payload, opts) => updateContent({ id: request.id, ...payload }, opts)}
                  onDelete={() => remove(request.id)}
                  isUpdating={isUpdatingContent}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {verseModalOpen && (
        <VerseSearchModal onInsert={handleInsertVerse} onClose={() => setVerseModalOpen(false)} />
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
