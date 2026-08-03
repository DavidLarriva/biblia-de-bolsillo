import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import VerseSearchModal from './VerseSearchModal'

export default function VerseLinkPicker({ value, onSelect }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)

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

  const selectedVerse = useMemo(
    () => (versesQuery.data ?? []).find((v) => v.id === value) ?? null,
    [versesQuery.data, value]
  )

  // Vincular reutiliza un versículo ya guardado con la misma referencia y
  // versión si existe; si no, lo guarda en la biblioteca del usuario para
  // poder vincularlo (así también queda disponible en "Versículos").
  const vincularMutation = useMutation({
    mutationFn: async ({ referencia, texto, version }) => {
      const existente = (versesQuery.data ?? []).find(
        (v) => v.reference === referencia && v.bible_version === version
      )
      if (existente) return existente.id

      const { data, error } = await supabase
        .from('saved_verses')
        .insert({ reference: referencia, verse_text: texto, bible_version: version, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data.id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['saved-verses', user?.id] })
      onSelect(id)
      setModalOpen(false)
    },
  })

  function handleInsert({ referencia, texto, version }) {
    vincularMutation.mutate({ referencia, texto, version })
  }

  if (selectedVerse) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm rounded-full bg-accent/10 text-accent px-2 py-1">
          {selectedVerse.reference}
        </span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={vincularMutation.isPending}
        className="self-start bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:border-accent disabled:opacity-60"
      >
        {vincularMutation.isPending ? 'Vinculando…' : 'Elegir versículo'}
      </button>

      {vincularMutation.isError && (
        <p className="text-xs text-red-400">No se pudo vincular el versículo. Intenta de nuevo.</p>
      )}

      {modalOpen && (
        <VerseSearchModal onInsert={handleInsert} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
