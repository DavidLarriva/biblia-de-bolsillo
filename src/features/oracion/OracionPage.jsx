import { useMemo, useState } from 'react'
import { usePrayerRequests } from '../../hooks/usePrayerRequests'
import AnswerPrayerModal from '../../components/AnswerPrayerModal'
import NotebookEditor from '../../components/NotebookEditor'
import TextoConVersiculos from '../../components/TextoConVersiculos'
import ShareButton from '../../components/ShareButton'
import TagInput from '../../components/TagInput'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'
import { convertirCitasEntreComillas, formatearParaCompartir } from '../../lib/versiculos'
import { toLocalDateString } from '../../lib/date'
import { describeSupabaseError } from '../../lib/errors'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Diferencia en días de calendario (no en horas transcurridas): una petición
// creada a las 23:50 y respondida a las 00:10 del día siguiente son fechas
// distintas pero casi el mismo instante, y viceversa —creada a las 00:05 y
// respondida a las 23:55 del MISMO día son ~24h de diferencia pero deberían
// contar como "el mismo día". Comparar timestamps crudos con Math.round
// daba resultados incorrectos en ese segundo caso.
function daysBetween(startIso, endIso) {
  const dayMs = 24 * 60 * 60 * 1000
  const toUTCTimestamp = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  const start = toUTCTimestamp(toLocalDateString(new Date(startIso)))
  const end = toUTCTimestamp(toLocalDateString(new Date(endIso)))
  return Math.round((end - start) / dayMs)
}

function formatAnsweredAfter(request) {
  const days = daysBetween(request.created_at, request.answered_at)
  if (days <= 0) return 'Respondida el mismo día'
  return `Respondida después de ${days} ${days === 1 ? 'día' : 'días'}`
}

function formatearPeticionParaCompartir(request) {
  const partes = [formatearParaCompartir(convertirCitasEntreComillas(request.content))]
  if (request.status === 'respondida' && request.answer_note) {
    partes.push(`Respuesta: ${formatearParaCompartir(convertirCitasEntreComillas(request.answer_note))}`)
  }
  return partes.join('\n\n')
}

function PrayerCard({ request, allTags, onUpdate, onDelete, onMarkAnswered, isUpdating }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(convertirCitasEntreComillas(request.content))
  const [draftTags, setDraftTags] = useState(request.tags ?? [])
  const [answerDraft, setAnswerDraft] = useState(convertirCitasEntreComillas(request.answer_note))

  const respondida = request.status === 'respondida'

  function startEdit() {
    setDraft(convertirCitasEntreComillas(request.content))
    setDraftTags(request.tags ?? [])
    setAnswerDraft(convertirCitasEntreComillas(request.answer_note))
    setIsEditing(true)
  }

  function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed) return
    const payload = { content: trimmed, tags: draftTags }
    if (respondida) payload.answerNote = answerDraft.trim() || null
    onUpdate(payload, { onSuccess: () => setIsEditing(false) })
  }

  return (
    <div className="bg-bg-elevated rounded-xl p-4 flex flex-col gap-4">
      <p className="text-xs text-text-muted">{formatDate(request.created_at)}</p>

      {isEditing ? (
        <div className="flex flex-col gap-3">
          <NotebookEditor
            value={draft}
            onChange={setDraft}
            editorClassName="text-text-primary leading-relaxed"
            minHeightClass="min-h-[4.5rem]"
          />
          <TagInput tags={draftTags} onChange={setDraftTags} suggestions={allTags} />
        </div>
      ) : (
        <>
          <TextoConVersiculos
            texto={convertirCitasEntreComillas(request.content)}
            className="text-text-primary"
          />
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

      {respondida && (
        <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
          <p className="text-base font-medium text-text-secondary">Respuesta:</p>

          {isEditing ? (
            <NotebookEditor
              value={answerDraft}
              onChange={setAnswerDraft}
              editorClassName="text-text-primary leading-relaxed"
              minHeightClass="min-h-[4.5rem]"
            />
          ) : request.answer_note ? (
            <TextoConVersiculos
              texto={convertirCitasEntreComillas(request.answer_note)}
              className="text-text-primary"
            />
          ) : (
            <p className="text-sm text-text-muted italic">Sin detalles todavía.</p>
          )}

          <p className="text-xs text-text-muted">{formatAnsweredAfter(request)}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {isEditing ? (
          <div className="flex items-center gap-4">
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
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
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
            </div>
            <ShareButton title="Oración" text={formatearPeticionParaCompartir(request)} />
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
  const [tags, setTags] = useState([])
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

  function handleConfirmAnswer(answerNote) {
    markAnswered({ id: answeringId, answerNote }, { onSuccess: () => setAnsweringId(null) })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-voice text-lg text-text-primary mb-3">Oración</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-bg-elevated rounded-xl p-4">
          <NotebookEditor
            value={content}
            onChange={setContent}
            editorClassName="text-text-primary leading-relaxed"
            minHeightClass="min-h-[4.5rem]"
          />
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
