import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useBibleVersion } from '../hooks/useBibleVersion'
import { useBibleBooks } from '../hooks/useBibleBooks'
import { bibleChapterQueryKey } from '../hooks/useBibleChapter'
import { obtenerCapitulo, describeBibleError } from '../lib/bibleApi'
import { parseReference } from '../lib/parseReference'
import BibleVersionToggle from './BibleVersionToggle'

const MEMORIZE_STATUSES = [
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'memorizado', label: 'Memorizado' },
]

export default function VerseFormModal({ mode, initialValues, existingVerse, onClose }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { version } = useBibleVersion()
  const { data: bibleBooksList } = useBibleBooks()

  const [reference, setReference] = useState(
    existingVerse?.reference ?? initialValues?.reference ?? ''
  )
  const [verseText, setVerseText] = useState(
    existingVerse?.verse_text ?? initialValues?.verseText ?? ''
  )
  const [bibleVersion, setBibleVersion] = useState(
    existingVerse?.bible_version ?? initialValues?.bibleVersion ?? null
  )
  const [notes, setNotes] = useState(existingVerse?.notes ?? '')
  const [tags, setTags] = useState(existingVerse?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [isMemorizing, setIsMemorizing] = useState(existingVerse?.is_memorizing ?? false)
  const [memorizeStatus, setMemorizeStatus] = useState(
    existingVerse?.memorize_status ?? 'en_proceso'
  )
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [formError, setFormError] = useState('')

  const tagsQuery = useQuery({
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

  const existingTags = useMemo(() => {
    const all = (tagsQuery.data ?? []).flatMap((v) => v.tags ?? [])
    return [...new Set(all)].sort()
  }, [tagsQuery.data])

  const tagSuggestions = useMemo(() => {
    const input = tagInput.trim().toLowerCase()
    if (!input) return []
    return existingTags.filter(
      (tag) => tag.toLowerCase().includes(input) && !tags.includes(tag)
    )
  }, [existingTags, tagInput, tags])

  function addTag(tag) {
    const clean = tag.trim()
    if (!clean || tags.includes(clean)) return
    setTags([...tags, clean])
    setTagInput('')
  }

  function removeTag(tag) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleTagInputKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(tagInput)
    }
  }

  async function handleSearch() {
    setSearchError('')
    const parsed = parseReference(reference, bibleBooksList ?? [])

    if (!parsed) {
      setSearchError(`No se reconoce el libro «${reference}»`)
      return
    }

    if (parsed.verse == null) {
      setSearchError('Indicá también el número de versículo (ej. Juan 3:16).')
      return
    }

    setSearching(true)
    try {
      const data = await queryClient.fetchQuery({
        queryKey: bibleChapterQueryKey(version, parsed.book.usfm_code, parsed.chapter),
        queryFn: () => obtenerCapitulo(version, parsed.book.usfm_code, parsed.chapter),
        staleTime: Infinity,
      })
      const match = data.versiculos.find((v) => v.versiculo === parsed.verse)
      if (match) {
        setVerseText(match.texto)
        setBibleVersion(version)
      } else {
        setVerseText('')
        setBibleVersion(null)
        setSearchError('No se encontró ese versículo.')
      }
    } catch (err) {
      setVerseText('')
      setBibleVersion(null)
      setSearchError(describeBibleError(err))
    } finally {
      setSearching(false)
    }
  }

  function invalidateVerseQueries() {
    queryClient.invalidateQueries({ queryKey: ['saved-verses', user?.id] })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        reference: reference.trim(),
        verse_text: verseText,
        bible_version: bibleVersion,
        notes: notes.trim() || null,
        tags,
        is_memorizing: isMemorizing,
        memorize_status: isMemorizing ? memorizeStatus : null,
      }

      if (mode === 'edit') {
        const { error } = await supabase
          .from('saved_verses')
          .update(payload)
          .eq('id', existingVerse.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('saved_verses')
          .insert({ ...payload, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: () => {
      invalidateVerseQueries()
      onClose()
    },
    onError: (err) => {
      setFormError(err.message ?? 'No se pudo guardar el versículo.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('saved_verses').delete().eq('id', existingVerse.id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidateVerseQueries()
      onClose()
    },
    onError: (err) => {
      setFormError(err.message ?? 'No se pudo eliminar el versículo.')
    },
  })

  function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    saveMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-bg-elevated rounded-xl p-6">
        <h2 className="font-voice text-xl text-text-primary mb-4">
          {mode === 'edit' ? 'Editar versículo' : 'Nuevo versículo'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="reference" className="text-sm text-text-secondary">
              Referencia
            </label>
            <input
              id="reference"
              type="text"
              placeholder="Juan 3:16"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <BibleVersionToggle />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching || !reference.trim()}
              className="text-sm text-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Buscando…' : 'Buscar texto'}
            </button>
          </div>
          {searchError && <p className="text-sm text-red-400 -mt-2">{searchError}</p>}

          <div className="flex flex-col gap-1">
            <label htmlFor="verseText" className="text-sm text-text-secondary">
              Texto
            </label>
            <textarea
              id="verseText"
              rows={4}
              value={verseText}
              onChange={(event) => setVerseText(event.target.value)}
              className="font-voice bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm text-text-secondary">
              Notas
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tagInput" className="text-sm text-text-secondary">
              Etiquetas
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-xs rounded-full bg-bg-elevated-2 text-text-secondary px-2 py-1"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
            )}
            <input
              id="tagInput"
              type="text"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="Escribí y presioná Enter"
              className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            />
            {tagSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {tagSuggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="text-xs rounded-full border border-border-subtle text-text-secondary px-2 py-1 hover:text-text-primary"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={isMemorizing}
              onChange={(event) => setIsMemorizing(event.target.checked)}
            />
            Marcar para memorizar
          </label>

          {isMemorizing && (
            <div className="flex items-center gap-3 text-sm">
              {MEMORIZE_STATUSES.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => setMemorizeStatus(status.value)}
                  className={
                    memorizeStatus === status.value ? 'text-accent' : 'text-text-muted'
                  }
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}

          {formError && <p className="text-sm text-red-400">{formError}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            {mode === 'edit' ? (
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="text-sm text-red-400 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} className="text-sm text-text-secondary">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || !reference.trim()}
                className="bg-accent text-accent-text rounded px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
