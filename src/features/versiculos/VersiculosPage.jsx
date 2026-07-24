import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import VerseFormModal from '../../components/VerseFormModal'
import EmptyState from '../../components/EmptyState'
import { SkeletonList } from '../../components/Skeleton'

const MEMORIZE_SUBFILTERS = [
  { value: 'todos', label: 'Todos' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'memorizado', label: 'Memorizados' },
]

const VERSION_LABELS = {
  rvr1960: 'RVR1960',
  ntv: 'NTV',
}

function VerseCard({ verse, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-bg-elevated rounded-xl p-5 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-voice text-text-primary">{verse.reference}</p>
        {verse.bible_version && (
          <span className="text-xs text-text-muted shrink-0">
            {VERSION_LABELS[verse.bible_version] ?? verse.bible_version}
          </span>
        )}
      </div>

      {verse.verse_text && (
        <p className="font-voice text-text-primary">{verse.verse_text}</p>
      )}

      {verse.notes && <p className="text-sm text-text-secondary">{verse.notes}</p>}

      {(verse.tags?.length > 0 || verse.memorize_status) && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {verse.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs rounded-full bg-bg-elevated-2 text-text-secondary px-2 py-1"
            >
              {tag}
            </span>
          ))}
          {verse.memorize_status && (
            <span className="text-xs rounded-full bg-accent/10 text-accent px-2 py-1">
              {verse.memorize_status === 'memorizado' ? 'Memorizado' : 'En proceso'}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

export default function VersiculosPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('todos')
  const [subFilter, setSubFilter] = useState('todos')
  const [tagFilter, setTagFilter] = useState('')
  const [modalState, setModalState] = useState(null)

  const versesQuery = useQuery({
    queryKey: ['saved-verses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_verses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const allTags = useMemo(() => {
    const all = (versesQuery.data ?? []).flatMap((v) => v.tags ?? [])
    return [...new Set(all)].sort()
  }, [versesQuery.data])

  const filteredVerses = useMemo(() => {
    return (versesQuery.data ?? []).filter((verse) => {
      if (filter === 'memorizar') {
        if (!verse.is_memorizing) return false
        if (subFilter !== 'todos' && verse.memorize_status !== subFilter) return false
      }
      if (tagFilter && !(verse.tags ?? []).includes(tagFilter)) return false
      return true
    })
  }, [versesQuery.data, filter, subFilter, tagFilter])

  const hasAnyVerses = (versesQuery.data ?? []).length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <button
              type="button"
              onClick={() => setFilter('todos')}
              className={filter === 'todos' ? 'text-accent' : 'text-text-muted'}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFilter('memorizar')}
              className={filter === 'memorizar' ? 'text-accent' : 'text-text-muted'}
            >
              Para memorizar
            </button>
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
          </div>

          {filter === 'memorizar' && (
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {MEMORIZE_SUBFILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSubFilter(option.value)}
                  className={subFilter === option.value ? 'text-accent' : 'text-text-muted'}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalState({ mode: 'create' })}
          className="bg-accent text-accent-text rounded px-3 py-2 text-sm font-medium shrink-0"
        >
          + nuevo
        </button>
      </div>

      {versesQuery.isLoading && <SkeletonList count={4} className="grid gap-4 sm:grid-cols-2" />}

      {versesQuery.isError && (
        <p className="text-sm text-red-400">
          No pudimos cargar tus versículos. Intentá recargar la página.
        </p>
      )}

      {!versesQuery.isLoading && !versesQuery.isError && !hasAnyVerses && (
        <EmptyState title="Guardá tu primer versículo">
          Los pasajes que quieras atesorar o memorizar van a vivir acá. Tocá «+ nuevo» para empezar.
        </EmptyState>
      )}

      {!versesQuery.isLoading && hasAnyVerses && filteredVerses.length === 0 && (
        <p className="text-sm text-text-secondary">
          Ningún versículo coincide con este filtro.
        </p>
      )}

      {filteredVerses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredVerses.map((verse) => (
            <VerseCard
              key={verse.id}
              verse={verse}
              onClick={() => setModalState({ mode: 'edit', existingVerse: verse })}
            />
          ))}
        </div>
      )}

      {modalState && (
        <VerseFormModal
          mode={modalState.mode}
          existingVerse={modalState.existingVerse}
          initialValues={modalState.initialValues}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  )
}
