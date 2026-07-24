import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export function journalEntriesQueryKey(userId) {
  return ['journal-entries', userId]
}

export function useJournalEntries() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = journalEntriesQueryKey(user?.id)

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*, saved_verses(*)')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey })
    queryClient.invalidateQueries({ queryKey: ['dashboard', user?.id] })
  }

  const saveMutation = useMutation({
    mutationFn: async ({ id, entryDate, content, linkedVerseId }) => {
      const payload = {
        entry_date: entryDate,
        content,
        linked_verse_id: linkedVerseId,
      }

      if (id) {
        const { error } = await supabase.from('journal_entries').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('journal_entries')
          .insert({ ...payload, user_id: user.id })
        if (error) throw error
      }
    },
    onSuccess: invalidateAll,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidateAll,
  })

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error || null,
  }
}
