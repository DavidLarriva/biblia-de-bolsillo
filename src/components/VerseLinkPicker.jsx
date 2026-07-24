import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function VerseLinkPicker({ value, onSelect }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')

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

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return (versesQuery.data ?? []).filter((v) => v.reference.toLowerCase().includes(q))
  }, [versesQuery.data, query])

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
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar por referencia (ej. Juan 3:16)"
        className="bg-bg-elevated-2 border border-border-subtle rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
      />
      {matches.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {matches.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onSelect(v.id)
                setQuery('')
              }}
              className="text-left text-sm text-text-secondary hover:text-text-primary bg-bg-elevated-2 rounded px-3 py-2"
            >
              {v.reference}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
